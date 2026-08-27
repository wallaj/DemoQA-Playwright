import { Locator, Page } from '@playwright/test';

/**
 * Page Object for the DemoQA Links page.
 * URL: https://demoqa.com/links
 */
export class LinksPage {
  constructor(private readonly page: Page) {}

  readonly simpleLink = this.page.locator('#simpleLink');
  readonly dynamicLink = this.page.locator('#dynamicLink');

  readonly createdLink = this.page.locator('#created');
  readonly noContentLink = this.page.locator('#no-content');
  readonly movedLink = this.page.locator('#moved');
  readonly badRequestLink = this.page.locator('#bad-request');
  readonly unauthorizedLink = this.page.locator('#unauthorized');
  readonly forbiddenLink = this.page.locator('#forbidden');
  readonly notFoundLink = this.page.locator('#invalid-url');
  readonly linkResponse = this.page.locator('#linkResponse');

  // Navigates to the Links page.
  async navigate(): Promise<void> {
    await this.page.goto('/links', { waitUntil: 'domcontentloaded' });
  }

  // Opens an external link and returns the new browser tab.
  async openExternalLink(link: Locator): Promise<Page> {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      link.click(),
    ]);
    await newPage.waitForURL(/https:\/\/demoqa\.com\/?/);
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }

  // Clicks an API link so DemoQA renders its status response below the links.
  async requestApiLink(link: Locator): Promise<void> {
    await link.scrollIntoViewIfNeeded();
    await link.click();
  }
}
