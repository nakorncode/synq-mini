import path from 'node:path';

import { defineConfig } from 'vitest/config';

// Vite resolves aliases as URL-like paths, so Windows separators must not leak in.
const src = `${path.resolve(__dirname, 'src').replace(/\\/g, '/')}/`;

export default defineConfig({
  resolve: {
    alias: [
      // The project writes both `~/ui/...` and `~core/...` to mean `src/...`.
      // String aliases only match on a `/` boundary, so `~core` needs a regex.
      { find: /^~\//, replacement: src },
      { find: /^~/, replacement: src }
    ]
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    globals: false
  }
});
