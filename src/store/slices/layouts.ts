import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { DEFAULT_LAYOUT, type Layout } from '~core/layout/Layout';
import { type MusicService } from '~types';

export interface LayoutsState {
  /** The chosen layout per music service. A missing key means "never chosen". */
  byMusicService: Partial<Record<MusicService, Layout>>;
}

const initialState: LayoutsState = {
  byMusicService: {}
};

const layoutsSlice = createSlice({
  name: 'layouts',
  initialState,
  reducers: {
    setLayout: (
      state,
      action: PayloadAction<{ musicService: MusicService; layout: Layout }>
    ) => {
      state.byMusicService[action.payload.musicService] = action.payload.layout;
    }
  }
});

export const { setLayout } = layoutsSlice.actions;

/**
 * The layout a player surface should render for a music service.
 *
 * The preference is stored per music service rather than per tab or per window,
 * so choosing a layout once holds for every surface that controls that service
 * (see ADR-0002).
 */
export const selectLayoutFor = (
  state: LayoutsState,
  musicService: MusicService | undefined
): Layout => {
  if (!musicService) {
    return DEFAULT_LAYOUT;
  }

  return state.byMusicService[musicService] ?? DEFAULT_LAYOUT;
};

export default layoutsSlice.reducer;
