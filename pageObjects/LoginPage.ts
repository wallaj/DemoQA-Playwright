import { Page } from '@playwright/test';

/**
 * Page Object for the DemoQA Login page (Book Store Application).
 * URL: https://demoqa.com/login
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  readonly userNameInput = this.page.locator('#userName');
  readonly passwordInput = this.page.locator('#password');
  readonly loginButton = this.page.locator('#login');
  readonly newUserButton = this.page.locator('#newUser');
  readonly userNameLabel = this.page.locator('#userName-label');

  async navigate(): Promise<void> {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
  }

  async login(userName: string, password: string): Promise<void> {
    await this.userNameInput.fill(userName);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
