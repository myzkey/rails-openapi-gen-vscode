/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'out/**',
      ],
    },
  },
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, './src/test/mocks/vscode.ts'),
      '~': path.resolve(__dirname, './src'),
    },
  },
})