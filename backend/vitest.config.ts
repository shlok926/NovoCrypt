import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'src/index.ts',
        'prisma/migrations/**',
        'tests/**',
        'scripts/**',
        'dist/**',
        '**/*.d.ts',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
    include: ['tests/**/*.test.ts'],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
