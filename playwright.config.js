const { defineConfig, devices } = require('@playwright/test');

const STUDENT_ID = '20120359';
const FEATURE = process.env.FEATURE || 'all';
const BROWSER = process.env.BROWSER || 'all';
const STAMP = new Date().toISOString();

module.exports = defineConfig({
  testDir: './tests',
  workers: 1,            // các test dùng chung 1 backend
  fullyParallel: false,
  retries: 0,            // không retry để không che bug
  timeout: 30_000,
  metadata: { 'Run by': STUDENT_ID, 'Started at': STAMP },
  reporter: [
    ['list'],
    ['html', {
      open: 'never',
      outputFolder: `reports/${FEATURE}-${BROWSER}`,
      title: `Run by: ${STUDENT_ID} | ${FEATURE} | ${BROWSER} | ${STAMP}`,
    }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'vi-VN',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
