/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const testFileForReport = (process.env.TEST_FILE ?? '').trim();

// Extract spec name from TEST_FILE if provided
function getSpecName(): string {
  if (testFileForReport) {
    // Extract filename without extension: tests/elements.spec.ts -> elements
    return testFileForReport
      .split('/')
      .pop()
      ?.replace('.spec.ts', '')
      ?.replace('.spec.js', '') || 'unknown';
  }
  return 'all-tests';
}

const specName = getSpecName();

// Reporters write here first; ReportSubfolderReporter renames this to
// index-all / index-selection / index-<tag> once it knows what actually ran
// (argv-based detection isn't reliable with VS Code's persistent test server).
const reportFolder = `test-results/${specName}/.pw-tmp`;
const junitFile = `junit-results/${specName}-pw-tmp-results.xml`;


/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['junit', { outputFile: junitFile }],
    ['html', { outputFolder: reportFolder, open: 'never' }],
    ['./utils/reportSubfolderReporter.ts', { reportFolder, junitFile }], // must run last: moves the temp output above once
  ],
  outputDir: reportFolder,
  /* Shared settings for all the projects below. */
  use: {
    baseURL: 'https://demoqa.com',
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry', // trace: when retrying a failed test
    screenshot: 'only-on-failure',
  },
  timeout: 10 * 60 * 1000,
  expect: {
    timeout: 10 * 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chrome',
      use: {
        channel: 'chrome',
        headless: false,
        launchOptions: { args: ['--incognito'] },
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        channel: 'firefox',
        headless: false,
        launchOptions: { args: ['--private'] },
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'edge',
      use: {
        channel: 'msedge',
        headless: false,
        launchOptions: { args: ['--inprivate'] },
        ...devices['Desktop Edge'],
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0 OS/10.0.22631',
        permissions: ['local-network-access'],
      },
    },
  ],
});
