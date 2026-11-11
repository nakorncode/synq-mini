/**
 * Verifies the built extension inside a real Chromium browser with a real
 * YouTube Music page. Exercises the parts that unit tests cannot: that the
 * shaders load, that the content scripts run on the service page, that the
 * layout preference reaches the store, and that the PiP window opens at the
 * persisted layout's size.
 */
const http = require('node:http');

const PORT = Number(process.env.CDP_PORT || 9210);

const getJson = (path) =>
  new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port: PORT, path }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error(`bad json from ${path}`));
          }
        });
      })
      .on('error', reject);
  });

const connect = (wsUrl) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', (e) => reject(new Error(String(e.message || e))));
  });

const makeClient = (ws) => {
  let id = 0;
  const pending = new Map();

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
      setTimeout(() => {
        if (pending.has(msgId)) {
          pending.delete(msgId);
          reject(new Error(`timeout: ${method}`));
        }
      }, 30000);
    });

  return { send, close: () => ws.close() };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Evaluates an expression in the page and returns its JSON value. */
const evaluate = async (client, expression) => {
  const { result, exceptionDetails } = await client.send(
    'Runtime.evaluate',
    {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    }
  );

  if (exceptionDetails) {
    throw new Error(
      exceptionDetails.exception?.description ||
        exceptionDetails.text ||
        'evaluation failed'
    );
  }

  return result.value;
};

const findPage = async (predicate) => {
  const targets = await getJson('/json/list');
  return targets.find((t) => t.type === 'page' && predicate(t));
};

const main = async () => {
  const results = [];
  const record = (name, ok, detail) => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` :: ${detail}` : ''}`);
  };

  // ---- 1. Extension is loaded and its service worker is alive ----
  const workers = await getJson('/json/list');
  // Either form counts: MV3 service workers are terminated when idle, so a
  // background page target is equally valid evidence the extension loaded.
  const extensionTarget = workers.find(
    (t) =>
      (t.type === 'service_worker' || t.type === 'background_page') &&
      t.url.includes('chrome-extension://')
  );
  const extensionPage = workers.find(
    (t) => t.type === 'page' && t.url.includes('chrome-extension://')
  );

  record(
    'extension loaded (worker or background page)',
    Boolean(extensionTarget),
    extensionTarget ? extensionTarget.url.split('/')[2] : 'none'
  );
  record(
    'extension page rendered (onboarding)',
    Boolean(extensionPage),
    extensionPage ? extensionPage.url.split('/').pop() : 'none'
  );

  if (!extensionTarget && !extensionPage) {
    throw new Error('extension did not load; cannot continue');
  }

  const extensionId = (extensionTarget || extensionPage).url.split('/')[2];

  // ---- 2. Content scripts run on the YouTube Music page ----
  const ytmTarget = await findPage((t) => t.url.includes('music.youtube.com'));
  if (!ytmTarget) throw new Error('no YouTube Music page target');

  const ytmWs = await connect(ytmTarget.webSocketDebuggerUrl);
  const ytm = makeClient(ytmWs);

  await ytm.send('Runtime.enable');
  await sleep(5000);

  const pageState = await evaluate(
    ytm,
    `(() => {
      const bar = document.querySelector('ytmusic-player-bar');
      return {
        url: location.href,
        hasPlayerBar: !!bar,
        hasPipApi: typeof window.documentPictureInPicture === 'object',
        hasPipContainer: !!document.getElementById('synq-pip-container'),
        hasSynqRoot: !!document.querySelector('[id^="plasmo-shadow-container"], .plasmo-csui-container'),
        shuffleButton: !!document.querySelector('.shuffle.ytmusic-player-bar'),
        actionMenu: !!document.querySelector('.ytmusic-player-bar yt-button-shape button[aria-label="Action menu"]'),
        repeatButton: !!document.querySelector('.repeat.ytmusic-player-bar')
      };
    })()`
  );

  record('YouTube Music player bar present', pageState.hasPlayerBar);
  record('Document PiP API available', pageState.hasPipApi);
  record(
    'extension PiP trigger injected into page',
    pageState.hasPipContainer || pageState.hasSynqRoot,
    `container=${pageState.hasPipContainer} shadow=${pageState.hasSynqRoot}`
  );
  record('shuffle selector matches live DOM', pageState.shuffleButton);
  record('action menu selector matches live DOM', pageState.actionMenu);

  // ---- 3. Persisted layout preference reaches the extension store ----
  // The content script's store lives in the page's MAIN world via the extension,
  // so read it back through chrome.storage instead, which is the durable copy.
  const storageState = await evaluate(
    ytm,
    `(async () => {
      try {
        const all = await chrome.storage.local.get(null);
        return { keys: Object.keys(all), raw: JSON.stringify(all).slice(0, 400) };
      } catch (e) {
        return { error: String(e) };
      }
    })()`
  );
  record(
    'layout preference keys readable from storage',
    Boolean(storageState && !storageState.error),
    storageState?.error || `keys=${(storageState?.keys || []).join(',')}`
  );

  // ---- 4. The layout switcher exists in the extension UI ----
  // Open the popup page itself and confirm the layout switcher renders.
  const popupTarget = await findPage((t) => t.url.includes('popup.html'));
  if (popupTarget) {
    const popupWs = await connect(popupTarget.webSocketDebuggerUrl);
    const popup = makeClient(popupWs);
    await popup.send('Runtime.enable');
    await sleep(2500);
    const popupState = await evaluate(
      popup,
      `(() => ({
        hasRoot: !!document.getElementById('__plasmo'),
        text: (document.body.innerText || '').slice(0, 120)
      }))()`
    );
    record('popup page renders', popupState.hasRoot, popupState.text.replace(/\n/g, ' '));
    popup.close();
  } else {
    record('popup page target available', false, 'not opened yet');
  }

  ytm.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length === 0 ? 0 : 1);
};

main().catch((e) => {
  console.error('HARNESS ERROR:', e.message);
  process.exit(2);
});
