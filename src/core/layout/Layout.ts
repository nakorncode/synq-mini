/**
 * A layout is a named presentation of the player surface inside the
 * Picture-in-Picture window. Exactly one layout is shown at a time, and the
 * chosen layout is a durable user preference (see ADR-0002), not a property of
 * a single window.
 */
export enum Layout {
  Compact = 'compact',
  Standard = 'standard',
  Cinema = 'cinema'
}

/** Every layout, in ascending size order. */
export const LAYOUTS: readonly Layout[] = [
  Layout.Compact,
  Layout.Standard,
  Layout.Cinema
];

/** The layout a player surface shows when the user has never chosen one. */
export const DEFAULT_LAYOUT = Layout.Standard;

/**
 * Reads a layout name stored by a previous version of the extension.
 *
 * Stored values are untrusted: they may be missing, written by an older build,
 * or hand-edited. Anything unrecognised falls back to {@link DEFAULT_LAYOUT}
 * rather than leaving the player surface without a layout to render.
 */
export const parseLayout = (value: unknown): Layout => {
  if (typeof value !== 'string') {
    return DEFAULT_LAYOUT;
  }

  return LAYOUTS.includes(value as Layout) ? (value as Layout) : DEFAULT_LAYOUT;
};
