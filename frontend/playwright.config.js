import { defineConfig, devices } from '@playwright/test'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const frontendDir = fileURLToPath(new URL('.', import.meta.url))
const backendDir = fileURLToPath(new URL('../backend/', import.meta.url))

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'API E2E',
      command: 'node scripts/e2eServer.js',
      cwd: backendDir,
      url: 'http://127.0.0.1:4100/api/launches',
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      name: 'Frontend E2E',
      command: 'npm run dev:e2e',
      cwd: frontendDir,
      env: { VITE_API_URL: 'http://127.0.0.1:4100/api' },
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
