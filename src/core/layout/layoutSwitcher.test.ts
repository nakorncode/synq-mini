import { describe, expect, it } from 'vitest';

import { Layout } from './Layout';
import { TARGET_PIP_SIZES, nextLayout, sizeForLayout } from './layoutSwitcher';

describe('nextLayout', () => {
  it('cycles compact -> standard -> cinema -> compact', () => {
    expect(nextLayout(Layout.Compact)).toBe(Layout.Standard);
    expect(nextLayout(Layout.Standard)).toBe(Layout.Cinema);
    expect(nextLayout(Layout.Cinema)).toBe(Layout.Compact);
  });

  it('always returns a different layout, so a click is never a no-op', () => {
    for (const layout of Object.values(Layout)) {
      expect(nextLayout(layout)).not.toBe(layout);
    }
  });
});

describe('sizeForLayout', () => {
  it('returns the target window size for each layout', () => {
    expect(sizeForLayout(Layout.Compact)).toEqual(TARGET_PIP_SIZES.compact);
    expect(sizeForLayout(Layout.Standard)).toEqual(TARGET_PIP_SIZES.standard);
    expect(sizeForLayout(Layout.Cinema)).toEqual(TARGET_PIP_SIZES.cinema);
  });

  it('never requests a non-positive size, which the API rejects', () => {
    for (const size of Object.values(TARGET_PIP_SIZES)) {
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    }
  });
});
