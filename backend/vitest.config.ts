import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['../tests/**/*.test.ts', 'src/**/*.test.ts'],
    globals: true,
    environment: 'node'
  },
  resolve: {
    alias: {
      bcryptjs: path.resolve(__dirname, 'node_modules/bcryptjs'),
      jsonwebtoken: path.resolve(__dirname, 'node_modules/jsonwebtoken')
    }
  }
});
