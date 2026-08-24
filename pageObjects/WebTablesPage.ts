import { Locator, Page } from '@playwright/test';

/**
 * Page Object for the DemoQA Web Tables page.
 * URL: https://demoqa.com/webtables
 */

// Registration data shape shared between the form fill-in and the table row read-back.
export type WebTableRecord = {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  salary: string;
  department: string;
};

export class WebTablesPage {
  constructor(private readonly page: Page) {}

  readonly addButton = this.page.locator('#addNewRecordButton');

  readonly registrationModal = this.page.locator('.modal-content');
  readonly registrationModalTitle = this.page.locator('#registration-form-modal');
  readonly registrationModalCloseButton = this.page.locator('.modal-content .btn-close');
  readonly submitButton = this.page.locator('#submit');

  readonly searchBox = this.page.locator('#searchBox');

  readonly firstNameLabel = this.page.locator('#firstName-label');
  readonly firstNameInput = this.page.locator('#firstName');

  readonly lastNameLabel = this.page.locator('#lastName-label');
  readonly lastNameInput = this.page.locator('#lastName');

  readonly emailLabel = this.page.locator('#userEmail-label');
  readonly emailInput = this.page.locator('#userEmail');

  readonly ageLabel = this.page.locator('#age-label');
  readonly ageInput = this.page.locator('#age');

  readonly salaryLabel = this.page.locator('#salary-label');
  readonly salaryInput = this.page.locator('#salary');

  readonly departmentLabel = this.page.locator('#department-label');
  readonly departmentInput = this.page.locator('#department');

  readonly rowsPerPageSelect = this.page.locator('.pagination select');
  readonly firstPageButton = this.page.locator('.pagination button', { hasText: 'First' });
  readonly previousPageButton = this.page.locator('.pagination button', { hasText: 'Previous' });
  readonly nextPageButton = this.page.locator('.pagination button', { hasText: 'Next' });
  readonly lastPageButton = this.page.locator('.pagination button', { hasText: 'Last' });
  readonly pageSummary = this.page.locator('.pagination strong');

  // Navigates to the Web Tables page.
  async navigate(): Promise<void> {
    await this.page.goto('/webtables', { waitUntil: 'domcontentloaded' });
  }

  // Opens the registration form modal via the Add button.
  // Uses a forced click because DemoQA's ad slots keep shifting the layout,
  // which otherwise fails Playwright's actionability/stability checks.
  async openAddNewRecordModal(): Promise<void> {
    await this.addButton.click({ force: true });
  }

  // Submits the registration form. Same forced-click reasoning as the Add button.
  async submitRegistrationForm(): Promise<void> {
    await this.submitButton.click({ force: true });
  }

  // Fills the registration form with the provided record data.
  async fillRegistrationForm(record: WebTableRecord): Promise<void> {
    await this.firstNameInput.fill(record.firstName);
    await this.lastNameInput.fill(record.lastName);
    await this.emailInput.fill(record.email);
    await this.ageInput.fill(record.age);
    await this.salaryInput.fill(record.salary);
    await this.departmentInput.fill(record.department);
  }

  // Filters the Web Tables records using the search box.
  async searchRecords(searchTerm: string): Promise<void> {
    await this.searchBox.fill(searchTerm);
  }

  // Clears the current search filter so the next search starts from the full table.
  async clearSearch(): Promise<void> {
    await this.searchBox.clear();
  }

  // Reports the input's native HTML validity (pattern/required), regardless of
  // whether the browser blocks the keystrokes that produced the current value.
  async isInputValid(input: Locator): Promise<boolean> {
    return input.evaluate((el: HTMLInputElement) => el.checkValidity());
  }

  // Locates the table row containing the given First Name.
  findRowByFirstName(firstName: string): Locator {
    return this.page.locator('table tbody tr', { hasText: firstName });
  }

  // Locates the table row containing the given email.
  findRowByEmail(email: string): Locator {
    return this.page.locator('table tbody tr', { hasText: email });
  }

  // Opens the Edit modal for the provided table row.
  async openEditForRow(row: Locator): Promise<void> {
    const editButton = row.locator('[title="Edit"]');
    await editButton.scrollIntoViewIfNeeded();
    await editButton.click({ force: true });
  }

  // Deletes the provided table row using its Delete action.
  async deleteRow(row: Locator): Promise<void> {
    const deleteButton = row.locator('[title="Delete"]');
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click({ force: true });
  }

  // Reads a table row's cells back into a WebTableRecord for comparison against the submitted data.
  async getRowRecord(row: Locator): Promise<WebTableRecord> {
    const cells = row.locator('td');
    return {
      firstName: (await cells.nth(0).textContent())?.trim() ?? '',
      lastName: (await cells.nth(1).textContent())?.trim() ?? '',
      age: (await cells.nth(2).textContent())?.trim() ?? '',
      email: (await cells.nth(3).textContent())?.trim() ?? '',
      salary: (await cells.nth(4).textContent())?.trim() ?? '',
      department: (await cells.nth(5).textContent())?.trim() ?? '',
    };
  }

  // Opens the Add modal, fills it, and submits it once per record. Used for bulk-load scenarios.
  async addRecords(records: WebTableRecord[]): Promise<void> {
    for (const record of records) {
      await this.openAddNewRecordModal();
      await this.fillRegistrationForm(record);
      await this.submitRegistrationForm();
      await this.registrationModal.waitFor({ state: 'hidden' });
    }
  }

  // Sets the "Show N" rows-per-page dropdown to reduce the number of pages to walk.
  async setRowsPerPage(rows: 10 | 20 | 30 | 40 | 50): Promise<void> {
    await this.rowsPerPageSelect.selectOption(String(rows));
  }

  // Returns the current pagination summary as "currentPage of totalPages".
  async getPaginationSummary(): Promise<{ currentPage: number; totalPages: number }> {
    // Default to "1 of 1" if the text is unexpectedly empty
    const summaryText = (await this.pageSummary.textContent())?.trim() ?? '1 of 1'; 
    const [currentPageText, totalPagesText] = summaryText.split(' of '); // Split the summary into current and total pages
    const currentPage = Number(currentPageText); // Convert the current page text to a number
    const totalPages = Number(totalPagesText ?? currentPageText); // Convert the total pages text to a number, defaulting to current page if missing
    return { currentPage, totalPages };
  }

  // Returns the currently selected rows-per-page value as a number.
  async getCurrentRowsPerPage(): Promise<number> {
    const selectedValue = await this.rowsPerPageSelect.inputValue();
    return Number(selectedValue);
  }

  // Counts every row currently in the table by selecting the largest page size
  // and walking through every page, summing the row count on each one.
  async getTotalRecordsCount(): Promise<number> {
    await this.setRowsPerPage(50);

    let total = 0;
    while (true) {
      total += await this.page.locator('table tbody tr').count();

      if (await this.nextPageButton.isDisabled()) {
        break;
      }
      await this.nextPageButton.click();
    }

    return total;
  }
}
