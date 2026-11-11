/**
 * Opens the extension's own PiP window from the real content script and inspects
 * what it renders. This is the end-to-end check that the layout system is wired
 * through: content script -> redux layout -> PiP document -> chosen surface.
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
            reject(new Error('bad json'));
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

const main = async () => {
  const targets = await getJson('/json/list');
  const ytmTarget = targets.find(
    (t) => t.type === 'page' && t.url.includes('music.youtube.com')
  );
  const ws = await connect(ytmTarget.webSocketDebuggerUrl);
  const client = makeClient(ws);
  await client.send('Runtime.enable');

  const run = async (expression) => {
    const r = await client.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    }
    return r.result.value;
  };

  const results = [];
  const record = (name, ok, detail) => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` :: ${detail}` : ''}`);
  };

  // Mute before anything plays.
  await run(`(() => {
    const mute = () => document.querySelectorAll('video,audio').forEach(e => { try { e.muted = true; e.volume = 0; } catch (x) {} });
    mute();
    if (!window.__muteTimer) window.__muteTimer = setInterval(mute, 200);
    try { const mp = document.querySelector('#movie_player'); mp.mute && mp.mute(); mp.setVolume && mp.setVolume(0); } catch (e) {}
    return true;
  })()`);

  // 1. The extension's PiP trigger is in the page.
  const triggerState = await run(`(() => {
    const container = document.getElementById('synq-pip-container');
    const btn = container ? container.querySelector('button') : null;
    return {
      containerExists: !!container,
      buttonExists: !!btn,
      buttonLabel: btn ? (btn.getAttribute('aria-label') || btn.innerText || '').slice(0, 60) : null
    };
  })()`);
  record(
    'PiP trigger button rendered by content script',
    triggerState.buttonExists,
    triggerState.buttonLabel || 'no button'
  );

  // 2. Open the PiP window through the extension's own button.
  const opened = await run(`(async () => {
    const container = document.getElementById('synq-pip-container');
    const btn = container && container.querySelector('button');
    if (!btn) return { error: 'no trigger button' };
    btn.click();
    await new Promise(r => setTimeout(r, 6000));
    const pip = window.documentPictureInPicture && window.documentPictureInPicture.window;
    if (!pip) return { error: 'no pip window after click' };
    const doc = pip.document;
    return {
      opened: true,
      width: pip.innerWidth,
      height: pip.innerHeight,
      // What did the PiP document actually render?
      bodyText: (doc.body.innerText || '').slice(0, 200),
      hasReactRoot: !!doc.querySelector('div'),
      buttonCount: doc.querySelectorAll('button').length,
      buttons: Array.from(doc.querySelectorAll('button')).map(b => ({
        aria: b.getAttribute('aria-label'),
        title: b.getAttribute('title')
      })).slice(0, 15),
      hasAlbumArt: !!doc.querySelector('img'),
      hasShuffle: Array.from(doc.querySelectorAll('button')).some(b => (b.getAttribute('aria-label') || '').toLowerCase().includes('shuffle')),
      hasLike: Array.from(doc.querySelectorAll('button')).some(b => (b.getAttribute('aria-label') || '').toLowerCase().includes('like')),
      hasPlaylist: Array.from(doc.querySelectorAll('button')).some(b => (b.getAttribute('aria-label') || '').toLowerCase().includes('playlist')),
      hasLayoutSwitch: Array.from(doc.querySelectorAll('button')).some(b => (b.getAttribute('aria-label') || '').toLowerCase().includes('layout'))
    };
  })()`);

  record('PiP window opened from extension trigger', Boolean(opened.opened), opened.error || `${opened.width}x${opened.height}`);
  if (opened.opened) {
    record('PiP rendered controls', opened.buttonCount > 0, `${opened.buttonCount} buttons: ${opened.buttons.map(b => b.aria).join(', ')}`);
    record('PiP renders shuffle button', opened.hasShuffle);
    record('PiP renders like button', opened.hasLike);
    record('PiP renders add-to-playlist button', opened.hasPlaylist);
    record('PiP renders layout switcher', opened.hasLayoutSwitch);
    record('PiP renders album art', opened.hasAlbumArt);
    console.log('\nPiP body text:', JSON.stringify(opened.bodyText));

    // 3. Switch layout inside the PiP window and confirm it re-renders.
    const switched = await run(`(async () => {
      const pip = window.documentPictureInPicture && window.documentPictureInPicture.window;
      if (!pip) return { error: 'pip closed' };
      const doc = pip.document;
      const before = {
        w: pip.innerWidth, h: pip.innerHeight,
        text: (doc.body.innerText || '').slice(0, 120)
      };
      // The layout switcher is the button whose aria-label starts with "Switch to".
      const switchBtn = Array.from(doc.querySelectorAll('button')).find(b => (b.getAttribute('aria-label') || '').startsWith('Switch to'));
      if (!switchBtn) return { error: 'no layout switcher', buttons: Array.from(doc.querySelectorAll('button')).map(b => b.getAttribute('aria-label')) };
      const targetLabel = switchBtn.getAttribute('aria-label');
      switchBtn.click();
      await new Promise(r => setTimeout(r, 2500));
      const after = {
        w: pip.innerWidth, h: pip.innerHeight,
        text: (doc.body.innerText || '').slice(0, 120),
        buttonCount: doc.querySelectorAll('button').length
      };
      return { before, after, targetLabel };
    })()`);

    if (switched.error) {
      record('layout switcher present in PiP', false, switched.error);
    } else {
      record('layout switcher present in PiP', true, switched.targetLabel);
      record(
        'layout switch changes the PiP surface',
        switched.after.buttonCount !== switched.before.buttonCount ||
          switched.after.text !== switched.before.text ||
          switched.after.w !== switched.before.w,
        `${switched.before.w}x${switched.before.h} -> ${switched.after.w}x${switched.after.h}, buttons ${switched.before.buttonCount ?? '?'} -> ${switched.after.buttonCount}`
      );
      console.log('\nAfter switch text:', JSON.stringify(switched.after.text));
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  client.close();
  process.exit(failed.length === 0 ? 0 : 1);
};

main().catch((e) => {
  console.error('HARNESS ERROR:', e.message);
  process.exit(2);
});
