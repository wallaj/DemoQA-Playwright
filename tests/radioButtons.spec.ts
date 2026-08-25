import { expect, Page, test } from '@playwright/test';
import { RadioButtonPage } from '../pageObjects/RadioButtonPage';
import { pauseOneSecond } from '../utils/wait.utils';

/**
 * Radio Button interaction suite for the DemoQA Radio Button page.
 * Scope: Validate enabled options and the disabled No option.
 * - Yes can be selected and appears in the response label
 * - Impressive can be selected and appears in the response label
 * - No is disabled and cannot be selected
 *
 * Note: Suite runs serially to preserve a single shared browser context, in line
 * with the checkbox suite's architecture.
 *
 * Out of scope: Selecting more than one radio button at a time and browser-native
 * radio implementation details.
 * 
 * Author: Marcos Urzúa
 */
let sharedPage: Page;
let radioButtonPage: RadioButtonPage;

test.describe.serial('Radio Button selection', () => {
  test.beforeAll(async ({ browser }) => {
    console.log('[SETUP] Starting browser context for radio button tests');
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    radioButtonPage = new RadioButtonPage(sharedPage);
    console.log('[SETUP] Navigating to the Radio Button page');
    await radioButtonPage.navigate();
    await pauseOneSecond(sharedPage);
  });

  test.afterAll(async () => {
    console.log('[TEARDOWN] Closing browser context');
    await sharedPage.context().close();
  });

  /**
   * Test 1: Yes selection
   * Scope: Verify the enabled Yes option can be selected.
   * Validations:
   * - Yes radio button is enabled
   * - Yes becomes checked
   * - Response label displays Yes
  */
  test('test1 - RADIO BUTTON: select Yes and verify response', async () => {
    console.log('[TEST1] Selecting the enabled "Yes" radio button');

    await expect(radioButtonPage.yesRadio).toBeEnabled();
    await radioButtonPage.select('Yes');
    await pauseOneSecond(sharedPage);

    await expect(radioButtonPage.yesRadio).toBeChecked();
    await expect(radioButtonPage.selectedMessage).toHaveText('Yes');
    expect(await radioButtonPage.getSelectedValue()).toBe('Yes');

    console.log('[TEST1] Yes selected and response verified');
  });

  /**
   * Test 2: Impressive selection
   * Scope: Verify the enabled Impressive option can be selected.
   * Validations:
   * - Impressive radio button is enabled
   * - Impressive becomes checked
   * - Response label displays Impressive
   */
  test('test2 - RADIO BUTTON: select Impressive and verify response', async () => {
    console.log('[TEST2] Selecting the enabled "Impressive" radio button');

    await expect(radioButtonPage.impressiveRadio).toBeEnabled();
    await radioButtonPage.select('Impressive');
    await pauseOneSecond(sharedPage);

    await expect(radioButtonPage.impressiveRadio).toBeChecked(); //State
    await expect(radioButtonPage.selectedMessage).toHaveText('Impressive'); //Text
    expect(await radioButtonPage.getSelectedValue()).toBe('Impressive'); //Get value 

    console.log('[TEST2] Impressive selected and response verified');
  });

  /**
   * Test 3: No disabled state
   * Scope: Verify the disabled No option cannot be selected.
   * Validations:
   * - No radio button is disabled
   * - No remains unchecked
   * - Response label never reflects No, regardless of prior test selections
   * Note: runs after test1/test2 on the shared page, so the response label may
   * still show the last enabled selection (native radios cannot be unchecked).
   */
  test('test3 - RADIO BUTTON: verify No is disabled', async () => {
    console.log('[TEST3] Verifying the disabled "No" radio button');

    await expect(radioButtonPage.noRadio).toBeDisabled();
    await expect(radioButtonPage.noRadio).not.toBeChecked();
    await expect(radioButtonPage.selectedMessage).not.toHaveText('No');
    await pauseOneSecond(sharedPage);
    await pauseOneSecond(sharedPage);

    console.log('[TEST3] No is disabled and cannot be selected');
  });
});
