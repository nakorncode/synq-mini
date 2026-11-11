# Verifying the built extension

The unit tests cover pure logic. They cannot prove the extension loads in a
browser, that content scripts run on the music service, or that a real
Picture-in-Picture window renders the controls. These scripts cover that gap.

## 1. Build

```bash
pnpm build
```

## 2. Launch an isolated browser with the extension loaded

Use a throwaway profile and a separate debugging port so a browser you are
already using is never touched.

```bash
chrome --user-data-dir="$TMP/synq-mini-test" \
       --remote-debugging-port=9210 \
       --load-extension="$PWD/build/chrome-mv3-prod" \
       --disable-extensions-except="$PWD/build/chrome-mv3-prod" \
       --no-first-run --no-default-browser-check \
       https://music.youtube.com/
```

## 3. Run the checks

```bash
node scripts/verify-extension.js   # extension loads, content scripts inject
node scripts/verify-pip.js         # PiP opens and renders every control
```

`verify-pip.js` is the end-to-end check: it clicks the extension's own PiP
trigger, then inspects the PiP document to confirm the shuffle, like,
add-to-playlist, and layout-switcher controls all rendered, and that switching
layout re-renders the surface at a new size.

## Muting during verification

YouTube Music starts playing as soon as a track is loaded. Both scripts mute
every `video` and `audio` element on load and re-apply the mute on an interval,
and they call `movie_player.mute()`/`setVolume(0)`, so verification never
produces sound.
