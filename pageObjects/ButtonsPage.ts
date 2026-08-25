import { Locator, Page } from '@playwright/test';

/**
 * Page Object for the DemoQA Buttons page.
 * URL: https://demoqa.com/buttons
 */
export class ButtonsPage {
  constructor(private readonly page: Page) {}

  readonly doubleClickButton = this.page.locator('#doubleClickBtn');
  readonly rightClickButton = this.page.locator('#rightClickBtn');
  readonly dynamicClickButton = this.page.getByRole('button', { name: /^Click Me$/ });

  readonly doubleClickMessage = this.page.locator('#doubleClickMessage');
  readonly rightClickMessage = this.page.locator('#rightClickMessage');
  readonly dynamicClickMessage = this.page.locator('#dynamicClickMessage');

  // Navigates to the Buttons page.
  async navigate(): Promise<void> {
    await this.page.goto('/buttons', { waitUntil: 'domcontentloaded' });
  }

  // Scrolls a button into view before the action so the demo run is observable.
  private async prepareButton(button: Locator): Promise<void> {
    await button.scrollIntoViewIfNeeded();
  }

  // Performs the Double Click Me action.
  async doubleClick(): Promise<void> {
    await this.prepareButton(this.doubleClickButton);
    await this.doubleClickButton.dblclick();
  }

  // Performs the Right Click Me action.
  async rightClick(): Promise<void> {
    await this.prepareButton(this.rightClickButton);
    await this.rightClickButton.click({ button: 'right' });
  }

  // Performs the regular Click Me action.
  async clickDynamicButton(): Promise<void> {
    await this.prepareButton(this.dynamicClickButton);
    await this.dynamicClickButton.click();
  }
}