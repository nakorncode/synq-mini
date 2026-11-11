import { describe, expect, it } from 'vitest';

import { DEFAULT_LAYOUT, Layout } from '~core/layout/Layout';

import reducer, { selectLayoutFor, setLayout } from './layouts';

describe('layouts slice', () => {
  it('starts with no per-service preference, so callers read the default', () => {
    const state = reducer(undefined, { type: '@@INIT' });

    expect(state.byMusicService).toEqual({});
    expect(selectLayoutFor(state, 'YOUTUBEMUSIC')).toBe(DEFAULT_LAYOUT);
  });

  it('remembers the chosen layout per music service', () => {
    const state = reducer(
      undefined,
      setLayout({ musicService: 'YOUTUBEMUSIC', layout: Layout.Cinema })
    );

    expect(selectLayoutFor(state, 'YOUTUBEMUSIC')).toBe(Layout.Cinema);
    // A different service keeps its own choice.
    expect(selectLayoutFor(state, 'SPOTIFY')).toBe(DEFAULT_LAYOUT);
  });

  it('keeps one service choice from overwriting another', () => {
    const withYtm = reducer(
      undefined,
      setLayout({ musicService: 'YOUTUBEMUSIC', layout: Layout.Compact })
    );
    const both = reducer(
      withYtm,
      setLayout({ musicService: 'SPOTIFY', layout: Layout.Cinema })
    );

    expect(selectLayoutFor(both, 'YOUTUBEMUSIC')).toBe(Layout.Compact);
    expect(selectLayoutFor(both, 'SPOTIFY')).toBe(Layout.Cinema);
  });

  it('treats an unknown service tab as having no preference', () => {
    const state = reducer(undefined, { type: '@@INIT' });

    expect(selectLayoutFor(state, undefined)).toBe(DEFAULT_LAYOUT);
  });
});
