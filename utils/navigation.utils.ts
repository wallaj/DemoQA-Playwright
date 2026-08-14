import { Page } from '@playwright/test';

export const BASE_URL = 'https://demoqa.com';

/**
 * Navigates to a DemoQA section by its path.
 * @example navigateTo(page, '/elements')
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  const url = `${BASE_URL}${path}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

/**
 * Scrolls an element into view before interacting with it.
 * Useful for DemoQA pages where elements are often below the fold.
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}
