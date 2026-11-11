import { useEffect, useState } from 'react';

/**
 * The selector YouTube Music uses for its own video element.
 *
 * Other services render no equivalent yet, so `cinema` falls back to the
 * cover-art stage for them (see ADR-0001).
 */
export const SERVICE_VIDEO_SELECTOR = 'video.video-stream';

/**
 * Whether the music service currently exposes a video element.
 *
 * This is the extension's only mode check: YouTube Music renders a `<video>` in
 * video mode and none at all in song mode, so presence of the element *is* the
 * mode (see ADR-0001). The check is kept live because the service can switch
 * modes on its own while the `cinema` layout is open, for example when the next
 * track has no video.
 *
 * This hook runs in the service tab's content-script context, so the default
 * `document` is the service's own document.
 */
export const useHasServiceVideo = (
  serviceDocument: Document = document
): boolean => {
  const [hasVideo, setHasVideo] = useState(
    () => serviceDocument.querySelector(SERVICE_VIDEO_SELECTOR) !== null
  );

  useEffect(() => {
    const read = () =>
      setHasVideo(
        serviceDocument.querySelector(SERVICE_VIDEO_SELECTOR) !== null
      );

    read();

    // The service swaps its video element when switching modes without any
    // event we can subscribe to, so the DOM subtree is observed instead.
    const observer = new MutationObserver(read);

    observer.observe(serviceDocument.documentElement, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [serviceDocument]);

  return hasVideo;
};
