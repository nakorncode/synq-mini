import { LAYOUTS, Layout } from './Layout';

export interface PipSize {
  width: number;
  height: number;
}

/**
 * The window size each layout asks for when the user switches to it.
 *
 * These are targets, not guarantees: Chrome treats a requested PiP size as a
 * hint and may clamp or ignore it (see ADR-0001). Layouts must therefore be
 * fluid and never rely on landing at exactly these dimensions.
 */
export const TARGET_PIP_SIZES: Record<Layout, PipSize> = {
  [Layout.Compact]: { width: 260, height: 72 },
  [Layout.Standard]: { width: 350, height: 135 },
  [Layout.Cinema]: { width: 960, height: 540 }
};

/**
 * The layout reached by clicking the layout control once.
 *
 * Cycling rather than presenting a menu keeps the switch to a single tap, which
 * matters because resizing a PiP window requires a user gesture: one click both
 * picks the layout and pays for the resize.
 */
export const nextLayout = (current: Layout): Layout => {
  const index = LAYOUTS.indexOf(current);
  const nextIndex = (index + 1) % LAYOUTS.length;

  return LAYOUTS[nextIndex];
};

export const sizeForLayout = (layout: Layout): PipSize =>
  TARGET_PIP_SIZES[layout];
