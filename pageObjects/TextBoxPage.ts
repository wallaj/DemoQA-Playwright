import { Page } from '@playwright/test';

/**
 * Page Object for the DemoQA Text Box page.
 * URL: https://demoqa.com/text-box
 */
export class TextBoxPage {
  constructor(private readonly page: Page) {}

  readonly fullNameInput = this.page.locator('#userName');
  readonly emailInput = this.page.locator('#userEmail');
  readonly currentAddressInput = this.page.locator('#currentAddress');
  readonly permanentAddressInput = this.page.locator('#permanentAddress');
  readonly submitButton = this.page.locator('#submit');

  readonly outputName = this.page.locator('#name');
  readonly outputEmail = this.page.locator('#email');
  readonly outputCurrentAddress = this.page.locator('p#currentAddress');
  readonly outputPermanentAddress = this.page.locator('p#permanentAddress');

  // Navigates to the Text Box page.
  async navigate(): Promise<void> {
    await this.page.goto('/text-box', { waitUntil: 'domcontentloaded' });
  }

  // Fills the form with the provided data.
  async fillForm(data: {
    fullName: string;
    email: string;
    currentAddress: string;
    permanentAddress: string;
  }): Promise<void> {
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    await this.currentAddressInput.fill(data.currentAddress);
    await this.permanentAddressInput.fill(data.permanentAddress);
  }
  
  // Submits the form.
  async submit(): Promise<void> {
    await this.submitButton.scrollIntoViewIfNeeded();
    await this.submitButton.click();
  }
}
