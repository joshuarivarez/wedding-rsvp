import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4300',
    channel: process.platform === 'win32' ? 'msedge' : 'chromium',
    headless: true,
  },
  webServer: {
    command: 'npm start -- --port 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: false,
  },
});
