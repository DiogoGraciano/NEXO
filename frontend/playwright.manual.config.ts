import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? 'http://localhost:5173';
const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e/manual',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 10_000 },
  globalSetup: path.resolve(__dirname, './e2e/setup/global-setup.ts'),
  outputDir: './test-results-manual',
  reporter: [['list']],
  use: {
    baseURL: FRONTEND_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    extraHTTPHeaders: { 'x-e2e': '1' },
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e/setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'manual',
      dependencies: ['setup'],
      testMatch: /(capture|fix)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        storageState: 'e2e/.auth/admin.json',
      },
    },
  ],
  webServer: [
    {
      command: process.env.E2E_BACKEND_CMD ?? 'cd ../backend && bun run start:dev',
      url: `${BACKEND_URL}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        NODE_ENV: 'test',
        PORT: '3000',
        DB_HOST: process.env.E2E_DB_HOST ?? 'localhost',
        DB_PORT: process.env.E2E_DB_PORT ?? '5432',
        DB_USERNAME: process.env.E2E_DB_USERNAME ?? 'postgres',
        DB_PASSWORD: process.env.E2E_DB_PASSWORD ?? 'postgres',
        DB_NAME: process.env.E2E_DB_NAME ?? 'nexo_e2e',
        JWT_SECRET: process.env.E2E_JWT_SECRET ?? 'e2e-secret-key',
        JWT_EXPIRES_IN: '7d',
        FRONTEND_URL,
        SMTP_HOST: process.env.E2E_SMTP_HOST ?? 'localhost',
        SMTP_PORT: process.env.E2E_SMTP_PORT ?? '1025',
        SMTP_USER: '',
        SMTP_PASSWORD: '',
        SMTP_FROM: 'noreply@nexo.local',
        RUN_SEEDERS: 'false',
      },
    },
    {
      command: `bun run dev -- --port 5173 --strictPort`,
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: { VITE_API_URL: BACKEND_URL },
    },
  ],
});
