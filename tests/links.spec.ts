import { expect, Locator, Page, test } from '@playwright/test';
import { LinksPage } from '../pageObjects/LinksPage';
import { pauseHalfSecond, pauseOneSecond } from '../utils/wait.utils';

/**
 * Links interaction suite for the DemoQA Links page.
 * Scope: Validate external navigation links and links that display API status responses.
 *
 * Note: Suite runs serially to preserve a single shared browser context, in line
 * with the Elements specs' architecture.
 *
 * Author: Marcos Urzúa
 */
let sharedPage: Page;
let linksPage: LinksPage;

test.describe.serial('LINKS: external navigation and API response links', () => {
  test.beforeAll(async ({ browser }) => {
    console.log('[SETUP] Starting browser context for links tests');
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    linksPage = new LinksPage(sharedPage);
    console.log('[SETUP] Navigating to the Links page');
    await linksPage.navigate();
    await pauseOneSecond(sharedPage);
  });

  test.afterAll(async () => {
    console.log('[TEARDOWN] Closing browser context');
    await sharedPage.context().close();
  });

  // ========== EXTERNAL NAVIGATION LINKS ==========

  /**
   * Test 1: External navigation links
   * Scope: Validate the two links that open the DemoQA home page in a new tab.
   * Validations:
   * - Each link is visible and enabled
   * - Each click opens a new page at the DemoQA home URL
   * Out of scope: Content and visual layout of the DemoQA home page.
   */
  test('test1 - EXTERNAL LINKS: opens the DemoQA home page in a new tab', async () => {
    console.log('[TEST1] Verifying the external navigation links');

    const externalLinks: { name: string; link: Locator }[] = [
      { name: 'Home', link: linksPage.simpleLink },
      { name: 'Dynamic Home', link: linksPage.dynamicLink },
    ];

    for (const { name, link } of externalLinks) {
      // Each external link must create a new tab whose URL is the DemoQA home page.
      console.log(`[TEST1] Opening the ${name} link`);
      await expect(link).toBeVisible();
      await expect(link).toBeEnabled();

      const homePage = await linksPage.openExternalLink(link);
      console.log(`[TEST1] ${name} opened URL: ${homePage.url()}`);
      expect(new URL(homePage.url()).origin).toBe('https://demoqa.com');
      expect(new URL(homePage.url()).pathname).toBe('/');
      await homePage.close();
      await pauseOneSecond(sharedPage);
    }

    console.log('[TEST1] ✓ Both external navigation links opened the DemoQA home page successfully');
  });

  // ========== API RESPONSE LINKS ==========

  /**
   * Test 2: API response links
   * Scope: Validate every link that calls a DemoQA API endpoint and displays its
   * HTTP status code and status text in the dynamic response label.
   * Validations:
   * - Created, No Content, Moved, Bad Request, Unauthorized, Forbidden, Not Found
   * - The response label shows the expected status code and status text for each link
   * Out of scope: API response bodies and backend implementation details.
   */
  test('test2 - API LINKS: displays the expected status code and text', async () => {
    console.log('[TEST2] Verifying every API response link and its dynamic label');

    const apiLinks: { name: string; link: Locator; statusCode: string; statusText: string }[] = [
      { name: 'Created', link: linksPage.createdLink, statusCode: '201', statusText: 'Created' },
      { name: 'No Content', link: linksPage.noContentLink, statusCode: '204', statusText: 'No Content' },
      { name: 'Moved', link: linksPage.movedLink, statusCode: '301', statusText: 'Moved Permanently' },
      { name: 'Bad Request', link: linksPage.badRequestLink, statusCode: '400', statusText: 'Bad Request' },
      { name: 'Unauthorized', link: linksPage.unauthorizedLink, statusCode: '401', statusText: 'Unauthorized' },
      { name: 'Forbidden', link: linksPage.forbiddenLink, statusCode: '403', statusText: 'Forbidden' },
      { name: 'Not Found', link: linksPage.notFoundLink, statusCode: '404', statusText: 'Not Found' },
    ];

    for (const { name, link, statusCode, statusText } of apiLinks) {
      // Click the link, then validate the dynamic label by its two stable signals:
      // the HTTP code and the status description returned by DemoQA.
      console.log(`[TEST2] Requesting ${name}: expected ${statusCode} ${statusText}`);
      await expect(link).toBeVisible();
      await expect(link).toBeEnabled();
      await linksPage.requestApiLink(link);
      await expect(linksPage.linkResponse).toBeVisible();
      await expect(linksPage.linkResponse).toContainText(statusCode);
      await expect(linksPage.linkResponse).toContainText(statusText);
      console.log(`[TEST2] Response verified: ${await linksPage.linkResponse.textContent()}`);
      await pauseOneSecond(sharedPage);
    }

    await pauseOneSecond(sharedPage);
    console.log('[TEST2] ✓ All API response links returned their expected status labels successfully');
  });
});
