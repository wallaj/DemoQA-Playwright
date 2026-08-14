import { APIRequestContext, Page } from '@playwright/test';

export const DEMOQA_BASE_URL = 'https://demoqa.com';

export type DemoQACredentials = {
  userName: string;
  password: string;
};

/**
 * Logs in to DemoQA Book Store via UI.
 */
export async function loginDemoQA(page: Page, credentials: DemoQACredentials): Promise<void> {
  await page.goto(`${DEMOQA_BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#userName').fill(credentials.userName);
  await page.locator('#password').fill(credentials.password);
  await page.locator('#login').click();
}

/**
 * Creates a DemoQA user via API.
 * Returns the userId on success.
 */
export async function createUserViaAPI(
  request: APIRequestContext,
  credentials: DemoQACredentials
): Promise<string> {
  const response = await request.post(`${DEMOQA_BASE_URL}/Account/v1/User`, {
    data: credentials,
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create user: ${response.status()} - ${body}`);
  }

  const body = await response.json();
  return body.userID as string;
}

/**
 * Generates an auth token for a DemoQA user via API.
 * Returns the token string.
 */
export async function generateTokenViaAPI(
  request: APIRequestContext,
  credentials: DemoQACredentials
): Promise<string> {
  const response = await request.post(`${DEMOQA_BASE_URL}/Account/v1/GenerateToken`, {
    data: credentials,
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to generate token: ${response.status()} - ${body}`);
  }

  const body = await response.json();
  return body.token as string;
}

/**
 * Deletes a DemoQA user via API.
 */
export async function deleteUserViaAPI(
  request: APIRequestContext,
  userId: string,
  token: string
): Promise<void> {
  const response = await request.delete(`${DEMOQA_BASE_URL}/Account/v1/User/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok() && response.status() !== 204) {
    const body = await response.text();
    throw new Error(`Failed to delete user: ${response.status()} - ${body}`);
  }
}
