import { expect, Page, test } from '@playwright/test';
import { ButtonsPage } from '../pageObjects/ButtonsPage';
import { pauseOneSecond } from '../utils/wait.utils';

/**
 * Buttons interaction suite for the DemoQA Buttons page.
 * Scope: Validate the three button interaction types exposed by the page.
 * - Double Click Me triggers the double-click confirmation message
 * - Right Click Me triggers the right-click confirmation message
 * - Click Me triggers the regular click confirmation message
 *
 * Note: Suite runs serially to preserve a single shared browser context, in line
 * with the Elements specs' architecture.
 *
 * Author: Marcos Urzúa
 */
let sharedPage: Page;
let buttonsPage: ButtonsPage;

test.describe.serial('BUTTONS: double click, right click, and regular click', () => {
  test.beforeAll(async ({ browser }) => {
    console.log('[SETUP] Starting browser context for buttons tests');
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    buttonsPage = new ButtonsPage(sharedPage);
    console.log('[SETUP] Navigating to the Buttons page');
    await buttonsPage.navigate();
    await pauseOneSecond(sharedPage);
  });

  test.afterAll(async () => {
    console.log('[TEARDOWN] Closing browser context');
    await sharedPage.context().close();
  });

  // ========== BUTTON ACTIONS ==========

  /**
   * Test 1: Button actions
   * Scope: Validate the three available button interactions in a single test.
   * Validations:
   * - Double Click Me is visible, enabled, and shows its confirmation message
   * - Right Click Me is visible, enabled, and shows its confirmation message
   * - Click Me is visible, enabled, and shows its confirmation message
   * Out of scope: Browser-native mouse event internals and visual styling.
   */
  test('test1 - BUTTONS: validates double click, right click, and regular click', async () => {
    console.log('[TEST1] Verifying the three Buttons page actions');

    // Double Click Me: validate the button is actionable, perform a real
    // double-click, and confirm DemoQA prints the expected result message.
    console.log('[TEST1] Performing Double Click Me action');
    await expect(buttonsPage.doubleClickButton).toBeVisible();
    await expect(buttonsPage.doubleClickButton).toBeEnabled();
    await buttonsPage.doubleClick();
    await pauseOneSecond(sharedPage);
    await expect(buttonsPage.doubleClickMessage).toHaveText('You have done a double click');
    console.log('[TEST1] Double click message verified');

    // Right Click Me: validate the button is actionable, perform a real
    // right-click, and confirm the right-click message appears.
    console.log('[TEST1] Performing Right Click Me action');
    await expect(buttonsPage.rightClickButton).toBeVisible();
    await expect(buttonsPage.rightClickButton).toBeEnabled();
    await buttonsPage.rightClick();
    await pauseOneSecond(sharedPage);
    await expect(buttonsPage.rightClickMessage).toHaveText('You have done a right click');
    console.log('[TEST1] Right click message verified');

    // Click Me: validate the regular click button is actionable, click it once,
    // and confirm the dynamic-click message appears.
    console.log('[TEST1] Performing Click Me action');
    await expect(buttonsPage.dynamicClickButton).toBeVisible();
    await expect(buttonsPage.dynamicClickButton).toBeEnabled();
    await buttonsPage.clickDynamicButton();
    await pauseOneSecond(sharedPage);
    await expect(buttonsPage.dynamicClickMessage).toHaveText('You have done a dynamic click');
    console.log('[TEST1] Regular click message verified');

    await pauseOneSecond(sharedPage);
    console.log('[TEST1] ✓ All Buttons page actions verified successfully');
  });
});