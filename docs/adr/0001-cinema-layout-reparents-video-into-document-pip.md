# Ship the cinema layout on Document Picture-in-Picture by re-parenting the service's video element

The `cinema` layout must show the music video at full frame together with this
extension's own controls. Native Picture-in-Picture (`requestPictureInPicture()`)
plays the video smoothly but renders no extension UI at all, so it cannot host the
shuffle, repeat, like, and add-to-playlist controls the layout requires.

We therefore use the Document Picture-in-Picture API for all three layouts, and for
`cinema` we re-parent the service's existing `<video>` element into the PiP document.

`cinema` mirrors the service's own mode instead of switching it. It has to touch no
player state at all: when the service exposes a video element it is re-parented, and
when it exposes none the layout falls back to a large cover-art stage. This removes
every auto-switch, timeout, retry, and restore-the-user's-mode decision from the
feature.

## Verified

Experiments against YouTube Music, audio muted throughout:

- Re-parenting the `<video>` element into the PiP document keeps playback running
  (position advanced 10.40s to 13.86s with the player staying in the playing state).
- Track changes are safe: the service keeps driving the same element, and the video
  stays inside the PiP document across a next-track action.
- The service exposes no video element at all in song mode, so presence of the
  element is itself the mode check. No separate mode detection is needed.

## Consequences

Re-parenting destroys the element with the PiP document unless it is moved back, so
video evacuation against a captured restore point is mandatory on `pagehide`.

Chrome treats the requested window size as a hint and may clamp or ignore it. Layout
switching therefore cannot promise an exact size; the layout must be fluid and read
its real viewport.

## Considered Options

- **Native Picture-in-Picture** - smoothest playback, but no extension UI, which
  excludes the controls this layout must show.
- **Auto-switching the service into video mode** - makes MV available in one click,
  but adds a wait, a retry path, a fallback, and an unanswered question about whether
  to restore the user's original mode afterwards.
- **Re-embedding the video through a second iframe player** - avoids moving a node,
  but plays the audio twice and has to stay in sync with the primary player.
