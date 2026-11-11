# Glossary

Domain language for the SynQ Mini fork. Implementation details do not belong here.

## Language

**Player surface**:
The visual area inside the Picture-in-Picture window that the user interacts with.
A player surface shows exactly one layout at a time.
_Avoid_: mini player, PiP UI, popup

**Layout**:
A named presentation of the player surface with a fixed size intent and a fixed set of controls.
The chosen layout is a durable user preference, not a property of one window.
_Avoid_: mode, view, theme

**`standard`**:
The default layout. Cover art, title, artist, seek bar, the full control row, and the queue.
_Avoid_: classic, normal, default

**`compact`**:
The smallest layout. Playback controls and track identity only; secondary controls appear on hover.
_Avoid_: mini, tiny, small

**`cinema`**:
The video-first layout. It mirrors the music service rather than steering it: it shows the
service's video at full frame when the service exposes one, and a large cover-art stage when it does not.
_Avoid_: music video, mv, fullscreen

**Cover art**:
The album artwork image obtained from the music service's player bar.
_Avoid_: thumbnail, album image

**Cover-art stage**:
The region of the `cinema` layout used when the service exposes no video element.
It shows the cover art against a blurred backdrop derived from the same art.
_Avoid_: fallback view, placeholder, empty state

**Video mode**:
A mode of the music service itself, not of this extension. The service renders a video element
that can be re-parented into another document.
_Avoid_: cinema mode, video layout

**Song mode**:
A mode of the music service itself. The service plays audio only and exposes no video element.
The absence of a video element is the only mode check the extension performs.
_Avoid_: audio mode, non-video

**Video stage**:
The region of the `cinema` layout that hosts the service's music video. It renders no picture
of its own; it re-parents the service's existing video element.
_Avoid_: video player, player element

**Restore point**:
The original parent node and sibling position of the video element, captured before re-parenting.
_Avoid_: placeholder, stub

**Video evacuation**:
Returning the re-parented video element to its restore point when the PiP window closes.
Skipping evacuation destroys the video element along with the PiP document.
_Avoid_: cleanup, teardown, restore

**Active tab**:
The music service tab whose player this PiP window controls.
_Avoid_: selected tab, current tab
