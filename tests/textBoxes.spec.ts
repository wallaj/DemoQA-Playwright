import { expect, Page, test } from '@playwright/test';
import { TextBoxPage } from '../pageObjects/TextBoxPage';
import { pauseOneSecond } from '../utils/wait.utils';

/**
 * Smoke test to verify the DemoQA Text Box page works correctly.
 * Serves as a baseline to confirm the project setup is functional.
 */
test.describe('HTML elements - Text Box, Check Box, Radio Button, Web Tables, Buttons, Links, Broken Links - Images, Upload and Download', () => {
  let textBoxPage: TextBoxPage;

  test.beforeEach(async ({ page }) => {
    textBoxPage = new TextBoxPage(page);
    console.log('[SETUP] Starting test: Navigating to the Text Box page');
    await textBoxPage.navigate();
  });
  test.afterAll(async ({ page }) => {
    console.log('[TEARDOWN] Closing browser context');
    await pauseOneSecond(page);
    await page.context().close();
  });

  test('TEXT BOX: should submit form and display output correctly', async ({ page }) => {
    // Fill the form with test data and submit
    console.log('[TEST] Filling the form with test data');
    // Fill the form with test data
    await textBoxPage.fillForm({
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      currentAddress: '123 Fake Street, Springfield',
      permanentAddress: '456 Oak Avenue, Shelbyville',
    });
    await pauseOneSecond(page);
    console.log('[TEST] Submitting the form');
    await textBoxPage.submit(); // Submit the form
    await pauseOneSecond(page);
    await expect(textBoxPage.outputName).toContainText('John Doe');
    await expect(textBoxPage.outputEmail).toContainText('john.doe@example.com');
    await expect(textBoxPage.outputCurrentAddress).toContainText('123 Fake Street');
    await expect(textBoxPage.outputPermanentAddress).toContainText('456 Oak Avenue');
    await pauseOneSecond(page);
    console.log('[TEST] Form submission output verified successfully');
  });
});
