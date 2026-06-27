import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    testTimeout: 20000,
    fileParallelism: false, // Run test files sequentially to prevent database conflicts
    sequence: {
      concurrent: false,
    },
  },
});
