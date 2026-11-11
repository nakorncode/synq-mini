import { describe, expect, it } from 'vitest';

import { DEFAULT_LAYOUT, Layout } from '~core/layout/Layout';

import reducer, {
  DEFAULT_LAYOUT_KEY,
  selectLayoutFor,
  setLayout
} from './layouts';

describe('layouts slice', () => {
  it('starts with no preference, so callers read the default', () => {
    const state = reducer(undefined, { type: '@@INIT' });

    expect(state.byKey).toEqual({});
    expect(selectLayoutFor(state, 'YOUTUBEMUSIC')).toBe(DEFAULT_LAYOUT);
  });

  it('remembers the chosen layout per music service', () => {
    const state = reducer(
      undefined,
      setLayout({ musicService: 'YOUTUBEMUSIC', layout: Layout.Cinema })
    );

    expect(selectLayoutFor(state, 'YOUTUBEMUSIC')).toBe(Layout.Cinema);
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

  it('reports the last choice to a surface that does not know its service yet', () => {
    // This is the PiP window's first paint: it renders before the background
    // worker has told it which service tab it belongs to.
    const state = reducer(
      undefined,
      setLayout({ musicService: 'YOUTUBEMUSIC', layout: Layout.Cinema })
    );

    expect(selectLayoutFor(state, undefined)).toBe(Layout.Cinema);
    expect(state.byKey[DEFAULT_LAYOUT_KEY]).toBe(Layout.Cinema);
  });

  it('stores a choice made without a known service', () => {
    const state = reducer(undefined, setLayout({ layout: Layout.Compact }));

    expect(selectLayoutFor(state, undefined)).toBe(Layout.Compact);
  });

  it('prefers the service-specific choice over the service-agnostic one', () => {
    const withDefault = reducer(
      undefined,
      setLayout({ layout: Layout.Compact })
    );
    const withService = reducer(
      withDefault,
      setLayout({ musicService: 'SPOTIFY', layout: Layout.Cinema })
    );

    expect(selectLayoutFor(withService, 'SPOTIFY')).toBe(Layout.Cinema);
  });
});
