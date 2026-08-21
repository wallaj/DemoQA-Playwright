/**
 * Page Object for the DemoQA Radio Button page.
 * URL: https://demoqa.com/radio-button
 */
export class RadioButtonPage {
  readonly yesRadio = this.page.locator('#yesRadio');
  readonly impressiveRadio = this.page.locator('#impressiveRadio');
  readonly noRadio = this.page.locator('#noRadio');
  readonly selectedMessage = this.page.locator('.text-success');

  constructor(private readonly page: import('@playwright/test').Page) {}

  /**
   * Navigates to the Radio Button page.
   */
  async navigate(): Promise<void> {
    await this.page.goto('/radio-button', { waitUntil: 'domcontentloaded' });
  }

  /**
   * Selects an enabled radio button by its visible option name.
   */
  async select(option: 'Yes' | 'Impressive'): Promise<void> {
    const radio = option === 'Yes' ? this.yesRadio : this.impressiveRadio;
    await radio.check();
  }

  /**
   * Returns the response text shown below the radio buttons.
   */
  async getSelectedValue(): Promise<string> {
    return (await this.selectedMessage.textContent())?.trim() ?? '';
  }
}
