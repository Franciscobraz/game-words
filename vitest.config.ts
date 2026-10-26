import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['{packages,tools,spikes}/*/src/**/*.test.ts'],
  },
});
