import { expect, Page, test } from '@playwright/test';
import { access } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { UploadsDownloadsPage } from '../pageObjects/UploadsDownloadsPage';
import { pauseOneSecond } from '../utils/wait.utils';

/**
 * Upload and Download interaction suite for the DemoQA Upload and Download page.
 * Scope: Download DemoQA's sample file into the system Downloads folder, then
 * upload that same file through the page input.
 *
 * Note: Suite runs serially to preserve a single shared browser context, in line
 * with the Elements specs' architecture.
 *
 * Author: Marcos Urzúa
 */
let sharedPage: Page;
let uploadsDownloadsPage: UploadsDownloadsPage;

test.describe.serial('UPLOAD AND DOWNLOAD: sample file transfer', () => {
  test.beforeAll(async ({ browser }) => {
    console.log('[SETUP] Starting browser context for upload and download tests');
    const context = await browser.newContext({ acceptDownloads: true });
    sharedPage = await context.newPage();
    uploadsDownloadsPage = new UploadsDownloadsPage(sharedPage);
    console.log('[SETUP] Navigating to the Upload and Download page');
    await uploadsDownloadsPage.navigate();
    await pauseOneSecond(sharedPage);
  });

  test.afterAll(async () => {
    console.log('[TEARDOWN] Closing browser context');
    await sharedPage.context().close();
  });

  // ========== DOWNLOAD AND UPLOAD ==========

  /**
   * Test 1: Download and upload Sample File
   * Scope: Validate the complete Sample File flow in a single independent test.
   * Validations:
  * - The Download button downloads sampleFile.jpeg into the system Downloads folder
   * - The downloaded file exists at the expected local path
   * - The Upload input accepts that same downloaded sample file
   * - DemoQA displays the uploaded file name in its dynamic label
   * Out of scope: File-content comparison and multi-file uploads.
   */
  test('test1 - UPLOAD AND DOWNLOAD: downloads Sample File and uploads it back', async () => {
    console.log('[TEST1] Starting Sample File download and upload validation');

    const downloadsDirectory = path.join(homedir(), 'Downloads');
    const sampleFilePath = path.join(downloadsDirectory, 'sampleFile.jpeg');

    // Download the Sample File and save the browser download explicitly into the
    // system Downloads folder, matching the standard destination a user sees.
    console.log(`[TEST1] Using the system Downloads folder: ${downloadsDirectory}`);
    await access(downloadsDirectory);
    await expect(uploadsDownloadsPage.downloadButton).toBeVisible();
    await expect(uploadsDownloadsPage.downloadButton).toBeEnabled();

    console.log('[TEST1] Downloading Sample File');
    const download = await uploadsDownloadsPage.downloadSampleFile();
    console.log(`[TEST1] Browser suggested file name: ${download.suggestedFilename()}`);
    expect(download.suggestedFilename()).toBe('sampleFile.jpeg');
    await download.saveAs(sampleFilePath);
    await access(sampleFilePath);
    console.log(`[TEST1] Sample File saved in the system Downloads folder: ${sampleFilePath}`);

    // Reuse the file just downloaded. This validates the upload input with the
    // real Sample File rather than with a fixture unrelated to the download.
    console.log('[TEST1] Uploading the downloaded Sample File');
    await expect(uploadsDownloadsPage.uploadInput).toBeVisible();
    await uploadsDownloadsPage.uploadFile(sampleFilePath);
    await pauseOneSecond(sharedPage);

    await expect(uploadsDownloadsPage.uploadedFilePath).toBeVisible();
    await expect(uploadsDownloadsPage.uploadedFilePath).toContainText('sampleFile.jpeg');
    console.log(`[TEST1] Upload result: ${await uploadsDownloadsPage.uploadedFilePath.textContent()}`);

    await pauseOneSecond(sharedPage);
    console.log('[TEST1] ✓ Sample File was downloaded into the system Downloads folder and uploaded successfully');
  });
});
