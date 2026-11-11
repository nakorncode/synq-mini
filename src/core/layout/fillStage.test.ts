import { beforeEach, describe, expect, it } from 'vitest';

import { clearStageStyles, fillStage } from './videoStage';

describe('fillStage', () => {
  let pipDocument: Document;
  let video: HTMLVideoElement;

  beforeEach(() => {
    pipDocument = document.implementation.createHTMLDocument('pip');
    video = pipDocument.createElement('video');
    pipDocument.body.append(video);
  });

  it('makes the service video fill the whole PiP window', () => {
    fillStage(video);

    expect(video.style.position).toBe('fixed');
    expect(video.style.top).toBe('0px');
    expect(video.style.left).toBe('0px');
    expect(video.style.width).toBe('100%');
    expect(video.style.height).toBe('100%');
  });

  it('letterboxes rather than distorting the picture', () => {
    fillStage(video);

    expect(video.style.objectFit).toBe('contain');
  });

  it('keeps the video behind the layout controls', () => {
    fillStage(video);

    expect(Number(video.style.zIndex)).toBeLessThan(1);
  });

  it('restores any inline styles it overwrote when cleared', () => {
    video.style.objectFit = 'cover';
    video.style.width = '640px';

    fillStage(video);
    clearStageStyles(video);

    expect(video.style.objectFit).toBe('cover');
    expect(video.style.width).toBe('640px');
    expect(video.style.position).toBe('');
  });

  it('is a no-op on a null video', () => {
    expect(() => fillStage(null)).not.toThrow();
    expect(() => clearStageStyles(null)).not.toThrow();
  });
});
