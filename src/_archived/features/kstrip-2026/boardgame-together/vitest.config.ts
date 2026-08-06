import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/server': path.resolve(__dirname, './node_modules/next/server.js'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', '.next'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.unit.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: [
            'src/**/*.integration.test.ts',
            'src/services/__tests__/**/*.test.ts',
          ],
          setupFiles: ['./src/test/setup.ts', './src/test/setup.integration.ts'],
          testTimeout: 30_000,
        },
      },
    ],
  },
});
