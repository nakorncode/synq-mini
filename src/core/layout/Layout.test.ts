import { describe, expect, it } from 'vitest';

import { LAYOUTS, Layout, parseLayout } from './Layout';

describe('Layout', () => {
  it('offers the three layouts in ascending size order', () => {
    expect(LAYOUTS).toEqual([Layout.Compact, Layout.Standard, Layout.Cinema]);
  });

  it('reads a stored layout name back', () => {
    expect(parseLayout('cinema')).toBe(Layout.Cinema);
    expect(parseLayout('compact')).toBe(Layout.Compact);
    expect(parseLayout('standard')).toBe(Layout.Standard);
  });

  it('falls back to standard for a missing or unknown stored value', () => {
    expect(parseLayout(undefined)).toBe(Layout.Standard);
    expect(parseLayout(null)).toBe(Layout.Standard);
    expect(parseLayout('')).toBe(Layout.Standard);
    expect(parseLayout('mini')).toBe(Layout.Standard);
    expect(parseLayout(42)).toBe(Layout.Standard);
  });
});
