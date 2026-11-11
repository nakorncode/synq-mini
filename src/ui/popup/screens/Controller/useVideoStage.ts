import { useEffect } from 'react';

import {
  captureRestorePoint,
  evacuateVideo,
  fillStage,
  hostVideo,
  type RestorePoint
} from '~core/layout/videoStage';
import { SERVICE_VIDEO_SELECTOR } from '~ui/shared/hooks/useHasServiceVideo';

/**
 * Re-parents the music service's video into the PiP document while `cinema` is
 * showing, and guarantees it is evacuated again on unmount.
 *
 * This runs in the service tab's content-script context, so the module-level
 * `document` is the service's own document while `pipDocument` is the separate
 * document inside the PiP window. The video is moved from the former into the
 * latter.
 *
 * The service is the source of truth for whether a video exists: in song mode
 * YouTube Music renders none, so there is nothing to host and the caller shows
 * the cover-art stage instead.
 */
export const useVideoStage = (
  pipDocument: Document | undefined,
  enabled: boolean
): void => {
  useEffect(() => {
    if (!enabled || !pipDocument) {
      return;
    }

    const video = document.querySelector<HTMLVideoElement>(
      SERVICE_VIDEO_SELECTOR
    );
    const restorePoint: RestorePoint | null = captureRestorePoint(video);

    if (!video || !restorePoint) {
      // Nothing to host: the service exposed no video element.
      return;
    }

    hostVideo(video, pipDocument, restorePoint);
    fillStage(video);

    return () => {
      // Evacuation is mandatory: the element is destroyed with the PiP document
      // otherwise, and the service does not recover from that.
      evacuateVideo(video, restorePoint);
    };
  }, [pipDocument, enabled]);
};
