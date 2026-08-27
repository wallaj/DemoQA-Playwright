import { Download, Page } from '@playwright/test';

/**
 * Page Object for the DemoQA Upload and Download page.
 * URL: https://demoqa.com/upload-download
 */
export class UploadsDownloadsPage {
  constructor(private readonly page: Page) {}

  readonly downloadButton = this.page.locator('#downloadButton');
  readonly uploadInput = this.page.locator('#uploadFile');
  readonly uploadedFilePath = this.page.locator('#uploadedFilePath');

  // Navigates to the Upload and Download page.
  async navigate(): Promise<void> {
    await this.page.goto('/upload-download', { waitUntil: 'domcontentloaded' });
  }

  // Clicks the Sample File download button and returns the browser download.
  async downloadSampleFile(): Promise<Download> {
    await this.downloadButton.scrollIntoViewIfNeeded();
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadButton.click();
    return downloadPromise;
  }

  // Uploads the file from the supplied local path.
  async uploadFile(filePath: string): Promise<void> {
    await this.uploadInput.scrollIntoViewIfNeeded();
    await this.uploadInput.setInputFiles(filePath);
  }
}
