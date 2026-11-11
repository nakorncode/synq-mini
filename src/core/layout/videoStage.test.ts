import { beforeEach, describe, expect, it } from 'vitest';

import { captureRestorePoint, evacuateVideo, hostVideo } from './videoStage';

/**
 * Builds the shape the music service actually uses: a container that holds the
 * video plus sibling overlay elements, so we can prove re-parenting preserves
 * the siblings and that evacuation puts the video back where it came from.
 */
const buildServicePlayer = () => {
  const container = document.createElement('div');
  container.id = 'html5-video-container';

  const video = document.createElement('video');
  video.className = 'video-stream';
  container.append(video);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  container.append(overlay);

  const player = document.createElement('div');
  player.id = 'movie_player';
  player.append(container);

  document.body.append(player);

  return { player, container, video, overlay };
};

describe('videoStage', () => {
  let pipDocument: Document;

  beforeEach(() => {
    document.body.innerHTML = '';
    pipDocument = document.implementation.createHTMLDocument('pip');
  });

  describe('when the service exposes a video element', () => {
    it('moves the video into the PiP document and leaves the siblings in place', () => {
      const { container, video, overlay } = buildServicePlayer();

      const restorePoint = captureRestorePoint(video);
      const hosted = hostVideo(video, pipDocument, restorePoint);

      expect(hosted).toBe(true);
      expect(pipDocument.contains(video)).toBe(true);
      expect(container.contains(video)).toBe(false);
      // The service's controls and overlays must survive the move.
      expect(container.contains(overlay)).toBe(true);
      expect(restorePoint).not.toBeNull();
    });

    it('puts the video back at its original position when evacuated', () => {
      const { container, video, overlay } = buildServicePlayer();

      const restorePoint = captureRestorePoint(video);
      hostVideo(video, pipDocument, restorePoint);

      evacuateVideo(video, restorePoint);

      expect(container.contains(video)).toBe(true);
      expect(container.contains(overlay)).toBe(true);
      // Restored before the overlay, i.e. the original DOM order.
      expect(container.firstElementChild).toBe(video);
      expect(pipDocument.contains(video)).toBe(false);
    });
  });

  describe('when the service exposes no video element', () => {
    it('reports that nothing was hosted, so the caller can show the cover-art stage', () => {
      const restorePoint = captureRestorePoint(null);

      expect(restorePoint).toBeNull();
      expect(hostVideo(null, pipDocument, restorePoint)).toBe(false);
    });

    it('evacuates harmlessly', () => {
      const restorePoint = captureRestorePoint(null);

      expect(() => evacuateVideo(null, restorePoint)).not.toThrow();
    });
  });

  describe('evacuating after the PiP window is already gone', () => {
    it('does not throw when the restore point node has left the document', () => {
      const { player, video } = buildServicePlayer();

      const restorePoint = captureRestorePoint(video);
      hostVideo(video, pipDocument, restorePoint);

      // The service re-rendered its shell while the PiP window was open.
      player.remove();

      expect(() => evacuateVideo(video, restorePoint)).not.toThrow();
    });
  });

  it('is idempotent, so a repeated evacuation cannot duplicate the video', () => {
    const { container, video } = buildServicePlayer();

    const restorePoint = captureRestorePoint(video);
    hostVideo(video, pipDocument, restorePoint);

    evacuateVideo(video, restorePoint);
    evacuateVideo(video, restorePoint);

    expect(container.querySelectorAll('video')).toHaveLength(1);
  });
});
