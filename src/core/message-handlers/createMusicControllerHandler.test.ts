import { describe, expect, it, vi } from 'vitest';

import type { ContentController } from '~core/adapter';
import { MusicControllerMessage } from '~types';

import { createContentControllerHandler } from './createMusicControllerHandler';

/** A hub that captures the listener so tests can drive messages through it. */
const createFakeHub = () => {
  let listener: ((message: unknown) => Promise<void>) | undefined;

  return {
    addListener: (fn: (message: unknown) => Promise<void>) => {
      listener = fn;
    },
    send: (message: unknown) => listener?.(message)
  };
};

const createController = () =>
  ({
    play: vi.fn(),
    playPause: vi.fn(),
    pause: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    toggleRepeatMode: vi.fn(),
    toggleLike: vi.fn(),
    toggleDislike: vi.fn(),
    toggleShuffle: vi.fn(),
    toggleMute: vi.fn(),
    setVolume: vi.fn(),
    seekTo: vi.fn(),
    getPlayerState: vi.fn(),
    getCurrentTrack: vi.fn(),
    getQueue: vi.fn(),
    playQueueTrack: vi.fn(),
    getTrackLinkDetails: vi.fn(),
    getAlbumLinkDetails: vi.fn(),
    getArtistLinkDetails: vi.fn()
  } as unknown as ContentController);

describe('createContentControllerHandler', () => {
  it('routes TOGGLE_SHUFFLE to the controller', async () => {
    const controller = createController();
    const hub = createFakeHub();

    createContentControllerHandler(controller, hub as never);
    await hub.send({ name: MusicControllerMessage.TOGGLE_SHUFFLE });

    expect(controller.toggleShuffle).toHaveBeenCalledOnce();
  });

  it('routes the existing repeat and like messages', async () => {
    const controller = createController();
    const hub = createFakeHub();

    createContentControllerHandler(controller, hub as never);
    await hub.send({ name: MusicControllerMessage.TOGGLE_REPEAT_MODE });
    await hub.send({ name: MusicControllerMessage.TOGGLE_LIKE });

    expect(controller.toggleRepeatMode).toHaveBeenCalledOnce();
    expect(controller.toggleLike).toHaveBeenCalledOnce();
  });

  it('ignores messages it does not handle instead of throwing', async () => {
    const hub = createFakeHub();

    createContentControllerHandler(createController(), hub as never);

    await expect(hub.send({ name: 'SOMETHING_ELSE' })).resolves.toBeUndefined();
    await expect(hub.send(undefined)).resolves.toBeUndefined();
  });
});
