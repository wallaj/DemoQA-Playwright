import { Page } from '@playwright/test';

/**
 * Short visual pause (500ms) for local observation.
 */
export async function pauseHalfSecond(page: Page): Promise<void> {
  await page.waitForTimeout(500);
}

/**
 * Visual pause (1000ms) for local observation.
 */
export async function pauseOneSecond(page: Page): Promise<void> {
  await page.waitForTimeout(1000);
}

/**
 * Visual pause (2000ms) for local observation.
 */
export async function pauseTwoSeconds(page: Page): Promise<void> {
  await page.waitForTimeout(2000);
}
