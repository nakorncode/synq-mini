/**
 * Verifies the add-to-playlist control on a live YouTube Music page.
 *
 * The control is the extension's hypothesis about where YTM hides its
 * save-to-playlist flow: the action menu of the currently playing queue item.
 * This checks the menu opens and exposes a "Save to playlist" item.
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
      return { __error: r.exceptionDetails.exception?.description || r.exceptionDetails.text };
    }
    return r.result.value;
  };

  // Wait for the queue to render, then mute everything.
  for (let i = 0; i < 20; i++) {
    const ready = await run(
      `!!document.querySelector('ytmusic-player-queue ytmusic-menu-renderer')`
    );
    if (ready === true) break;
    await sleep(1500);
  }
  await run(`(() => {
    const mute = () => document.querySelectorAll('video,audio').forEach(e => { try { e.muted = true; e.volume = 0; } catch (x) {} });
    mute();
    if (!window.__muteTimer) window.__muteTimer = setInterval(mute, 200);
    try { const mp = document.querySelector('#movie_player'); mp.mute && mp.mute(); mp.setVolume && mp.setVolume(0); } catch (e) {}
    return true;
  })()`);

  const results = [];
  const record = (name, ok, detail) => {
    results.push({ name, ok });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` :: ${detail}` : ''}`);
  };

  // 1. Does the selector the adapter uses find a queue-item action menu?
  const selectorCheck = await run(`(() => {
    const sels = [
      'ytmusic-player-queue ytmusic-player-queue-item[selected] ytmusic-menu-renderer button[aria-label="Action menu"]',
      'ytmusic-player-queue ytmusic-player-queue-item:first-of-type ytmusic-menu-renderer button[aria-label="Action menu"]',
      'ytmusic-player-queue ytmusic-menu-renderer button[aria-label="Action menu"]'
    ];
    return sels.map(s => ({ sel: s, n: document.querySelectorAll(s).length }));
  })()`);
  record(
    'queue-item action menu selector matches',
    selectorCheck.some((s) => s.n > 0),
    selectorCheck.map((s) => `${s.n}`).join('/')
  );

  // 2. Click it and confirm "Save to playlist" appears.
  const opened = await run(`(async () => {
    const btn = document.querySelector('ytmusic-player-queue ytmusic-menu-renderer button[aria-label="Action menu"]');
    if (!btn) return { error: 'no queue action menu' };
    btn.click();
    await new Promise(r => setTimeout(r, 2500));
    const items = Array.from(document.querySelectorAll(
      'ytmusic-menu-navigation-item-renderer, ytmusic-menu-service-item-renderer'
    )).map(el => (el.textContent || '').trim()).filter(Boolean);
    const save = items.find(t => t.toLowerCase().includes('save to playlist'));
    return { menuItemCount: items.length, hasSaveToPlaylist: !!save, items: items.slice(0, 12) };
  })()`);

  record(
    'action menu exposes "Save to playlist"',
    Boolean(opened.hasSaveToPlaylist),
    opened.error || `${opened.menuItemCount} items`
  );
  if (opened.items) {
    console.log('  menu items:', JSON.stringify(opened.items));
  }

  // 3. Clicking "Save to playlist" opens YTM's playlist picker.
  const picker = await run(`(async () => {
    const items = Array.from(document.querySelectorAll(
      'ytmusic-menu-navigation-item-renderer, ytmusic-menu-service-item-renderer'
    ));
    const save = items.find(el => (el.textContent || '').toLowerCase().includes('save to playlist'));
    if (!save) return { error: 'no save item' };
    save.click();
    await new Promise(r => setTimeout(r, 2500));
    const dialogs = Array.from(document.querySelectorAll(
      'ytmusic-playlist-add-to-option-renderer, tp-yt-paper-dialog, ytmusic-dialog-renderer'
    )).map(el => ({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 100) }));
    const visibleDialog = dialogs.find(d => d.text.toLowerCase().includes('new playlist') || d.text.toLowerCase().includes('playlist'));
    return { dialogCount: dialogs.length, playlistPickerOpened: !!visibleDialog, sample: dialogs.slice(0, 3) };
  })()`);

  record(
    'playlist picker opens',
    Boolean(picker.playlistPickerOpened),
    picker.error || `${picker.dialogCount} dialogs`
  );
  if (picker.sample) {
    console.log('  dialogs:', JSON.stringify(picker.sample));
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
