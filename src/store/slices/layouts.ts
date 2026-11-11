import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { DEFAULT_LAYOUT, type Layout } from '~core/layout/Layout';
import { type MusicService } from '~types';

/**
 * The layout preference, keyed so it can be read back before the active tab is
 * known.
 *
 * The key is the music service name where one is available. A Picture-in-Picture
 * window paints before the background worker has answered which service tab it
 * belongs to, and keying strictly by service would make that first paint fall
 * back to the default and then never correct itself. `DEFAULT_KEY` covers that
 * gap: a preference saved without a known service is still a preference, and it
 * is what the switcher reads until the service resolves.
 */
export const DEFAULT_LAYOUT_KEY = 'default';

export type LayoutKey = MusicService | typeof DEFAULT_LAYOUT_KEY;

export interface LayoutsState {
  /** The chosen layout per key. A missing key means "never chosen". */
  byKey: Partial<Record<LayoutKey, Layout>>;
}

const initialState: LayoutsState = {
  byKey: {}
};

const layoutsSlice = createSlice({
  name: 'layouts',
  initialState,
  reducers: {
    setLayout: (
      state,
      action: PayloadAction<{ musicService?: MusicService; layout: Layout }>
    ) => {
      const key = action.payload.musicService ?? DEFAULT_LAYOUT_KEY;

      state.byKey[key] = action.payload.layout;

      // Keep the service-agnostic key current too, so a surface that has not yet
      // learned its service still shows the layout the user last picked.
      state.byKey[DEFAULT_LAYOUT_KEY] = action.payload.layout;
    }
  }
});

export const { setLayout } = layoutsSlice.actions;

/**
 * The layout a player surface should render.
 *
 * Lookup order is service-specific first, then the service-agnostic key, then
 * the default. That way an explicit choice always wins, and a surface that does
 * not yet know its service still renders the user's last choice instead of
 * snapping back to the default.
 */
export const selectLayoutFor = (
  state: LayoutsState,
  musicService: MusicService | undefined
): Layout => {
  if (musicService) {
    const forService = state.byKey[musicService];

    if (forService) {
      return forService;
    }
  }

  return state.byKey[DEFAULT_LAYOUT_KEY] ?? DEFAULT_LAYOUT;
};

export default layoutsSlice.reducer;
