import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'e2e',
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3010',
    trace: 'on-first-retry',
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  webServer: {
    command: 'rm -f .next/dev/lock && pnpm dev --port 3010 --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3010',
    reuseExistingServer: !process.env.CI,
    env: {
      LEADS_DRY_RUN: '1',
    },
    timeout: 120 * 1000,
  },
};

export default config;
