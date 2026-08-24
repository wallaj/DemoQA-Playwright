import { expect, Page, test } from '@playwright/test';
import { WebTablesPage, WebTableRecord } from '../pageObjects/WebTablesPage';
import { pauseHalfSecond, pauseOneSecond } from '../utils/wait.utils';
import { generateWebTableRecords } from '../utils/testData.utils';

/**
 * Web Tables interaction suite for the DemoQA Web Tables page.
 * Scope: Validate the table's controls and record management one element/function at a time.
 *
 * Note: Suite runs serially to preserve a single shared browser context, in line
 * with the checkbox and radio button suites' architecture.
 *
 * Author: Marcos Urzúa
 */
let sharedPage: Page;
let webTablesPage: WebTablesPage;

test.describe.serial('WEB TABLES: table controls and record management', () => {
  test.beforeAll(async ({ browser }) => {
    console.log('[SETUP] Starting browser context for web tables tests');
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    webTablesPage = new WebTablesPage(sharedPage);
    console.log('[SETUP] Navigating to the Web Tables page');
    await webTablesPage.navigate();
  });

  test.afterAll(async () => {
    console.log('[TEARDOWN] Closing browser context');
    await sharedPage.context().close();
  });

  // ========== ADD BUTTON ==========

  /**
   * Test 1: Add Button opens the Registration Form modal
   * Scope: Verify the Add button exists, is enabled, and opens a complete registration form.
   * Validations:
   * - Add button is visible and enabled
   * - Clicking Add opens the modal with the "Registration Form" title
   * - Each field label matches its expected text
   * - Each field input has the expected placeholder
   * Out of scope: Submitting the form, field validation rules, table row updates
   */
  test('test1 - ADD BUTTON: opens registration form modal with correct fields', async () => {
    console.log('[TEST1] Verifying the Add button and the registration form modal it opens');

    await expect(webTablesPage.addButton).toBeVisible();
    await expect(webTablesPage.addButton).toBeEnabled();
    await pauseOneSecond(sharedPage);

    console.log('[TEST1] Opening the registration form modal');
    await webTablesPage.openAddNewRecordModal();
    await pauseOneSecond(sharedPage);

    await expect(webTablesPage.registrationModal).toBeVisible();
    await expect(webTablesPage.registrationModalTitle).toHaveText('Registration Form');
    await pauseOneSecond(sharedPage);

    console.log('[TEST1] Verifying each field label and placeholder');
    // structure of fields to check: label, input, expected title, expected placeholder
    const fields = [
      { label: webTablesPage.firstNameLabel, input: webTablesPage.firstNameInput, title: 'First Name', placeholder: 'First Name' },
      { label: webTablesPage.lastNameLabel, input: webTablesPage.lastNameInput, title: 'Last Name', placeholder: 'Last Name' },
      { label: webTablesPage.emailLabel, input: webTablesPage.emailInput, title: 'Email', placeholder: 'name@example.com' },
      { label: webTablesPage.ageLabel, input: webTablesPage.ageInput, title: 'Age', placeholder: 'Age' },
      { label: webTablesPage.salaryLabel, input: webTablesPage.salaryInput, title: 'Salary', placeholder: 'Salary' },
      { label: webTablesPage.departmentLabel, input: webTablesPage.departmentInput, title: 'Department', placeholder: 'Department' },
    ];

    // Iterate through each field and validate its label and placeholder
    for (const { label, input, title, placeholder } of fields) {
      console.log(`[TEST1] Checking field "${title}"`);
      await expect(label).toBeVisible();
      await expect(label).toHaveText(title);
      console.log(`[TEST1] "${title}" is visible and the label was verified`);
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', placeholder);
      console.log(`[TEST1] "${title}" the placeholder was verified`);
      await pauseHalfSecond(sharedPage);
    }
    await pauseOneSecond(sharedPage);

    console.log('[TEST1] ✓ Add button and registration form modal verified successfully');
  });

  /**
   * Test 2: Add Button submits a new record and persists it in the table
   * Scope: Verify the registration form validates malformed input and, once corrected,
   * saves the record and reflects it in the table.
   * Validations:
   * - Email/Age/Salary reject an invalid value (native HTML validity) before being corrected
   * - Submit saves the record and closes the modal
   * - The new row, found by First Name, matches every field submitted
   * Out of scope: Edit/Delete actions, duplicate records, server-side persistence
   */
  test('test2 - NEW RECORD: submits a new record and validates it in the table', async () => {
    console.log('[TEST2] Filling the registration form and submitting a new record');

    // Data entered in the form, kept aside to validate against the table row afterwards.
    const newRecord: WebTableRecord = {
      firstName: 'Marcos',
      lastName: 'Urzua',
      email: 'marcos.urzua@example.com',
      age: '32',
      salary: '75000',
      department: 'QA',
    };

    // Types an invalid value, confirms the browser rejects it, clears the field,
    // then types the valid value and confirms it is accepted.
    const fillWithRejectThenAccept = async (
      fieldName: string,
      input: typeof webTablesPage.emailInput,
      invalidValue: string,
      validValue: string
    ) => {
      console.log(`[TEST2] "${fieldName}": entering invalid value "${invalidValue}"`);
      await input.fill(invalidValue);
      await pauseHalfSecond(sharedPage);
      const isRejected = !(await webTablesPage.isInputValid(input));
      console.log(`[TEST2] "${fieldName}": browser rejected the invalid value = ${isRejected}`);
      expect(isRejected).toBe(true);

      console.log(`[TEST2] "${fieldName}": clearing the rejected value`);
      await input.clear();
      await pauseHalfSecond(sharedPage);

      console.log(`[TEST2] "${fieldName}": entering valid value "${validValue}"`);
      await input.fill(validValue);
      await pauseHalfSecond(sharedPage);
      const isAccepted = await webTablesPage.isInputValid(input);
      console.log(`[TEST2] "${fieldName}": browser accepted the valid value = ${isAccepted}`);
      expect(isAccepted).toBe(true);
    };

    console.log('[TEST2] Filling First Name and Last Name');
    await webTablesPage.firstNameInput.fill(newRecord.firstName);
    await pauseHalfSecond(sharedPage);
    await webTablesPage.lastNameInput.fill(newRecord.lastName);
    await pauseHalfSecond(sharedPage);

    // Fill Email, Age, and Salary with invalid values first to confirm the browser rejects them, then correct them with valid values.
    await fillWithRejectThenAccept('Email', webTablesPage.emailInput, 'invalid-email-format', newRecord.email);
    await fillWithRejectThenAccept('Age', webTablesPage.ageInput, '9a', newRecord.age);
    await fillWithRejectThenAccept('Salary', webTablesPage.salaryInput, '12a34', newRecord.salary);

    console.log('[TEST2] Filling Department');
    await webTablesPage.departmentInput.fill(newRecord.department);
    await pauseHalfSecond(sharedPage);

    console.log('[TEST2] Submitting the registration form');
    await webTablesPage.submitRegistrationForm();
    await pauseOneSecond(sharedPage);

    await expect(webTablesPage.registrationModal).toBeHidden();
    console.log('[TEST2] Modal closed after a successful submit');

    console.log('[TEST2] Locating the new row by First Name and validating every field');
    const newRow = webTablesPage.findRowByFirstName(newRecord.firstName);
    await expect(newRow).toBeVisible();
    await pauseOneSecond(sharedPage);

    const savedRecord = await webTablesPage.getRowRecord(newRow);
    console.log(`[TEST2] Data found in the saved row: ${JSON.stringify(savedRecord)}`);
    expect(savedRecord).toEqual(newRecord);
    console.log('[TEST2] New row found and every field matches the submitted data');
    await pauseOneSecond(sharedPage);

    console.log('[TEST2] ✓ New record submitted and verified in the table successfully');
  });

  // ========== BULK LOAD ==========

  /**
   * Test 3: Bulk load of new records
   * Scope: Verify a batch of records (JSON dataset) can be loaded through the Add
   * flow and that the table reflects the correct total afterwards.
   * Validations:
   * - At least 40 new records are generated and submitted successfully
   * - Total rows in the table equals the pre-existing count plus the newly loaded ones
   * Out of scope: Selecting rows-per-page and page navigation as end-user features
   * (covered by future tests), Edit/Delete actions.
   */
  test('test3 - MASSIVE RECORD: bulk loads 40 records and validates the total count', async () => {
    console.log('[TEST3] Counting pre-existing records before the bulk load');
    const existingCount = await webTablesPage.getTotalRecordsCount();
    console.log(`[TEST3] Records found before bulk load: ${existingCount}`);

    const bulkRecords = generateWebTableRecords(40);
    console.log(`[TEST3] Generated ${bulkRecords.length} records for the bulk load`);

    console.log('[TEST3] Submitting every generated record through the Add flow');
    await webTablesPage.addRecords(bulkRecords);
    console.log('[TEST3] Bulk load finished');

    console.log('[TEST3] Counting total records after the bulk load');
    const totalCount = await webTablesPage.getTotalRecordsCount();
    const expectedTotal = existingCount + bulkRecords.length;
    console.log(
      `[TEST3] Records found after bulk load: ${totalCount} (expected ${existingCount} + ${bulkRecords.length} = ${expectedTotal})`
    );

    expect(totalCount).toBe(expectedTotal);

    const isNextAvailable = await webTablesPage.nextPageButton.isEnabled();
    if (isNextAvailable) {
      console.log('[TEST3] Demonstrative navigation: clicking Next to move to the next page');
      await webTablesPage.nextPageButton.click();
      await pauseOneSecond(sharedPage);
    } else {
      console.log('[TEST3] Next button is disabled because all rows fit on a single page (50 rows max)');
    }

    await pauseOneSecond(sharedPage);
    console.log('[TEST3] ✓ Bulk load completed and total record count verified successfully');
  });

  // ========== PAGINATION ==========


  /**
   * Test 4: Pagination controls and rows-per-page selector
   * Scope: Validate the selector values first, then interact with the page
   * controls to confirm the real pagination flow after the bulk load.
   * Validations:
   * - The default value is 50 rows per page
   * - The selector is validated in order: 50, 40, 30, 20, 10
   * - Each selected value must produce the correct total pages using the formula
   *   totalRows / rowsPerPage = totalPages
   * - After the selector is checked, the actual page-navigation buttons are used:
   *   Next, Last, First, Previous
   * Execution note:
   * - This test must run serially after Test 3 because Test 3 creates the bulk
   *   records needed to make the table span multiple pages.
   */
  test('test4 - PAGINATION: validates selector options and page navigation buttons', async () => {
    console.log('[TEST4] Starting pagination validation after the TEST3 bulk load');

    // Move the viewport down to the pagination area so the selector and buttons
    // are visible before the test starts operating them.
    console.log('[TEST4] Scrolling down to the pagination selector');
    await webTablesPage.rowsPerPageSelect.scrollIntoViewIfNeeded();
    await pauseOneSecond(sharedPage);

    const pageOptions = [50, 40, 30, 20, 10] as const;
    const defaultRowsPerPage = await webTablesPage.getCurrentRowsPerPage();
    const totalRows = await webTablesPage.getTotalRecordsCount();

    // The bulk load from Test 3 leaves the table on its default selector value:
    // 50 rows per page. With the current dataset, every record fits on page 1,
    // so all four pagination buttons must start disabled.
    console.log(`[TEST4] Default rows-per-page value found: ${defaultRowsPerPage}`);
    expect(defaultRowsPerPage).toBe(50);
    console.log(`[TEST4] Total rows available for pagination: ${totalRows}`);
    console.log('[TEST4] Validating initial button state at 50 rows per page');
    await expect(webTablesPage.firstPageButton).toBeDisabled();
    await expect(webTablesPage.previousPageButton).toBeDisabled();
    await expect(webTablesPage.nextPageButton).toBeDisabled();
    await expect(webTablesPage.lastPageButton).toBeDisabled();

    // Now operate the selector option by option. For each selected value,
    // validate the selected option and the page label calculation before moving
    // to the next selector value.
    for (const rowsPerPage of pageOptions) {
      console.log(`[TEST4] Validating selector option: ${rowsPerPage} rows per page`);
      await webTablesPage.setRowsPerPage(rowsPerPage);
      await pauseHalfSecond(sharedPage);

      const selectedRowsPerPage = await webTablesPage.getCurrentRowsPerPage();
      const expectedPages = Math.ceil(totalRows / rowsPerPage);
      const pageSummaryAfterChange = await webTablesPage.getPaginationSummary();
      const formulaMessage = `${totalRows} / ${rowsPerPage} = ${expectedPages}`;

      console.log(
        `[TEST4] Selector value ${rowsPerPage}: ${formulaMessage} | current page summary ${pageSummaryAfterChange.currentPage} of ${pageSummaryAfterChange.totalPages}`
      );
      expect(selectedRowsPerPage).toBe(rowsPerPage);
      expect(pageSummaryAfterChange.totalPages).toBe(expectedPages);
      await pauseOneSecond(sharedPage);
    }

    // After the last selector validation, the table is intentionally left at 10
    // rows per page. This creates multiple pages and enables the navigation
    // buttons needed for the second half of this test.
    console.log('[TEST4] Finished selector validation at 10 rows per page; now validating page navigation buttons');
    const summaryAt10Rows = await webTablesPage.getPaginationSummary();
    expect(summaryAt10Rows.currentPage).toBe(1);

    if (summaryAt10Rows.totalPages > 1) {
      // Page 1 baseline: First and Previous cannot move anywhere yet, while
      // Next and Last must be available because 10 rows per page creates more
      // than one page after the bulk load.
      console.log('[TEST4] Validating page 1 button state before navigation');
      await expect(webTablesPage.firstPageButton).toBeDisabled();
      await expect(webTablesPage.previousPageButton).toBeDisabled();
      await expect(webTablesPage.nextPageButton).toBeEnabled();
      await expect(webTablesPage.lastPageButton).toBeEnabled();

      // Next moves from page 1 to page 2 and enables backward navigation.
      console.log('[TEST4] Clicking Next');
      await webTablesPage.nextPageButton.click();
      await pauseOneSecond(sharedPage);

      const summaryAfterNext = await webTablesPage.getPaginationSummary();
      console.log(`[TEST4] After clicking Next: page summary is ${summaryAfterNext.currentPage} of ${summaryAfterNext.totalPages}`);
      expect(summaryAfterNext.currentPage).toBe(2);
      await expect(webTablesPage.firstPageButton).toBeEnabled();
      await expect(webTablesPage.previousPageButton).toBeEnabled();

      // Last jumps to the final page; from there, forward navigation must be disabled.
      console.log('[TEST4] Clicking Last');
      await webTablesPage.lastPageButton.click();
      await pauseOneSecond(sharedPage);

      const summaryAfterLast = await webTablesPage.getPaginationSummary();
      console.log(`[TEST4] After clicking Last: page summary is ${summaryAfterLast.currentPage} of ${summaryAfterLast.totalPages}`);
      expect(summaryAfterLast.currentPage).toBe(summaryAfterLast.totalPages);
      await expect(webTablesPage.nextPageButton).toBeDisabled();
      await expect(webTablesPage.lastPageButton).toBeDisabled();

      // First returns to page 1 and restores the initial backward-navigation state.
      console.log('[TEST4] Clicking First');
      await webTablesPage.firstPageButton.click();
      await pauseOneSecond(sharedPage);

      const summaryAfterFirst = await webTablesPage.getPaginationSummary();
      console.log(`[TEST4] After clicking First: page summary is ${summaryAfterFirst.currentPage} of ${summaryAfterFirst.totalPages}`);
      expect(summaryAfterFirst.currentPage).toBe(1);
      await expect(webTablesPage.firstPageButton).toBeDisabled();
      await expect(webTablesPage.previousPageButton).toBeDisabled();

      // Previous is part of the button scope; on page 1 it must remain disabled,
      // so the validation is explicit instead of forcing an invalid click.
      console.log('[TEST4] Validating Previous remains disabled on page 1');
      await expect(webTablesPage.previousPageButton).toBeDisabled();
    } else {
      console.log('[TEST4] Only one page is available, so the paging buttons stay disabled by design');
      await expect(webTablesPage.firstPageButton).toBeDisabled();
      await expect(webTablesPage.previousPageButton).toBeDisabled();
      await expect(webTablesPage.nextPageButton).toBeDisabled();
      await expect(webTablesPage.lastPageButton).toBeDisabled();
    }

    await pauseOneSecond(sharedPage);
    console.log('[TEST4] ✓ Selector values and pagination buttons verified successfully');
  });

  // ========== SEARCH BOX ==========

  /**
   * Test 5: Search box filters table records
   * Scope: Validate the search input independently from the bulk-load and
   * pagination tests.
   * Validations:
   * - The search box filters records by letters
   * - The search box filters records by numbers
   * - A non-existing word returns the empty-results state
   * Execution note:
   * - This test can run independently because it reloads the Web Tables page at
   *   the beginning and uses DemoQA's default records.
   */
  test('test5 - SEARCH BOX: filters records by letters, numbers, and no-match text', async () => {
    console.log('[TEST5] Starting independent search-box validation');

    // Reload the page so this test starts from the default records and does not
    // depend on the bulk data or pagination state left by previous tests.
    console.log('[TEST5] Reloading the Web Tables page to reset the table state');
    await webTablesPage.navigate();
    await pauseOneSecond(sharedPage);

    await expect(webTablesPage.searchBox).toBeVisible();
    await expect(webTablesPage.searchBox).toBeEnabled();

    // Search by letters: use a default first name and confirm the matching row
    // remains visible while another default row is filtered out.
    console.log('[TEST5] Filtering records by letters using the term "Cierra"');
    await webTablesPage.searchRecords('Cierra');
    await pauseOneSecond(sharedPage);
    await expect(webTablesPage.searchBox).toHaveValue('Cierra');
    await expect(webTablesPage.findRowByFirstName('Cierra')).toBeVisible();
    await expect(webTablesPage.findRowByFirstName('Alden')).toBeHidden();
    console.log('[TEST5] Letter filter returned the expected record');

    // Clear the first search before changing the criterion, so the numeric
    // validation starts from the complete default table again.
    console.log('[TEST5] Clearing the letter filter');
    await webTablesPage.clearSearch();
    await pauseHalfSecond(sharedPage);
    await expect(webTablesPage.searchBox).toHaveValue('');

    // Search by numbers: use Cierra's default salary to prove that numeric
    // values can filter the table just like text values.
    console.log('[TEST5] Filtering records by numbers using the term "10000"');
    await webTablesPage.searchRecords('10000');
    await pauseOneSecond(sharedPage);
    await expect(webTablesPage.searchBox).toHaveValue('10000');
    await expect(webTablesPage.findRowByFirstName('Cierra')).toBeVisible();
    await expect(webTablesPage.findRowByFirstName('Alden')).toBeHidden();
    console.log('[TEST5] Numeric filter returned the expected record');

    // Clear the numeric search before testing the no-results branch.
    console.log('[TEST5] Clearing the numeric filter');
    await webTablesPage.clearSearch();
    await pauseHalfSecond(sharedPage);
    await expect(webTablesPage.searchBox).toHaveValue('');

    // Search for a value that is not present in any default record. DemoQA does
    // not render a "No rows found" message here; the visible empty state is the
    // pagination label changing to Page 1 of 0 with the known rows hidden.
    console.log('[TEST5] Filtering with a non-existing word');
    await webTablesPage.searchRecords('NoExistingRecord2026');
    await pauseOneSecond(sharedPage);
    await expect(webTablesPage.searchBox).toHaveValue('NoExistingRecord2026');
    await expect(webTablesPage.findRowByFirstName('Cierra')).toBeHidden();
    await expect(webTablesPage.findRowByFirstName('Alden')).toBeHidden();
    await pauseOneSecond(sharedPage);
    const noResultsSummary = await webTablesPage.getPaginationSummary();
    // The pagination summary is the only visible indicator of an empty table state.
    console.log(`[TEST5] No-match pagination state: page ${noResultsSummary.currentPage} of ${noResultsSummary.totalPages}`);
    expect(noResultsSummary.currentPage).toBe(1);
    expect(noResultsSummary.totalPages).toBe(0);
    await expect(webTablesPage.firstPageButton).toBeDisabled();
    await expect(webTablesPage.previousPageButton).toBeDisabled();
    await expect(webTablesPage.nextPageButton).toBeDisabled();
    await expect(webTablesPage.lastPageButton).toBeDisabled();
    console.log('[TEST5] Non-existing word returned the expected empty-results state');

    await webTablesPage.clearSearch();
    await pauseOneSecond(sharedPage);
    console.log('[TEST5] ✓ Search box filters verified successfully');
  });

  // ========== EDIT AND DELETE RECORD ==========

  /**
   * Test 6: Edit and delete a table record
   * Scope: Validate the row-level Edit and Delete actions using an existing
   * visible record from the default table.
   * Validations:
   * - Clicking Edit opens the modal with the selected row's current data
   * - Submitting modified values updates the row in the table
   * - Clicking a visible Trash icon removes the selected record from the table
   * Execution note:
   * - This test can run independently because it reloads the Web Tables page
   *   before operating on DemoQA's default records.
   */
  test('test6 - EDIT AND DELETE: updates a record and removes it from the table', async () => {
    console.log('[TEST6] Starting independent edit and delete validation');

    // Reload the page so the test starts from DemoQA's default data and does
    // not depend on records created by previous tests.
    console.log('[TEST6] Reloading the Web Tables page to reset the table state');
    await webTablesPage.navigate();
    await pauseOneSecond(sharedPage);

    const initialCount = await webTablesPage.getTotalRecordsCount();
    console.log(`[TEST6] Records found before editing and deleting: ${initialCount}`);

    const originalRecord: WebTableRecord = {
      firstName: 'Cierra',
      lastName: 'Vega',
      email: 'cierra@example.com',
      age: '39',
      salary: '10000',
      department: 'Insurance',
    };

    const updatedRecord: WebTableRecord = {
      firstName: 'CierraEdited',
      lastName: 'VegaUpdated',
      email: 'cierra.edited@example.com',
      age: '40',
      salary: '12000',
      department: 'Automation QA',
    };

    // Work with an existing visible record from the default table.
    const editableRow = webTablesPage.findRowByEmail(originalRecord.email);
    await expect(editableRow).toBeVisible();
    const recordBeforeEdit = await webTablesPage.getRowRecord(editableRow);
    console.log(`[TEST6] Existing row selected for edit: ${JSON.stringify(recordBeforeEdit)}`);
    expect(recordBeforeEdit).toEqual(originalRecord);

    // Open Edit from the row action icon and confirm the modal belongs to the
    // selected row by checking every preloaded field value.
    console.log('[TEST6] Opening the Edit modal for the selected existing record');
    await webTablesPage.openEditForRow(editableRow);
    await pauseOneSecond(sharedPage);
    await expect(webTablesPage.registrationModal).toBeVisible();
    await expect(webTablesPage.registrationModalTitle).toHaveText('Registration Form');
    await expect(webTablesPage.firstNameInput).toHaveValue(originalRecord.firstName);
    await expect(webTablesPage.lastNameInput).toHaveValue(originalRecord.lastName);
    await expect(webTablesPage.emailInput).toHaveValue(originalRecord.email);
    await expect(webTablesPage.ageInput).toHaveValue(originalRecord.age);
    await expect(webTablesPage.salaryInput).toHaveValue(originalRecord.salary);
    await expect(webTablesPage.departmentInput).toHaveValue(originalRecord.department);
    console.log('[TEST6] Edit modal opened with the selected row data');

    // Modify the full record, submit the modal, and validate that the old data
    // disappears while the updated data is persisted in the table.
    console.log('[TEST6] Updating the selected record and submitting the modal');
    await webTablesPage.fillRegistrationForm(updatedRecord);
    await pauseOneSecond(sharedPage);
    await webTablesPage.submitRegistrationForm();
    await pauseOneSecond(sharedPage);
    await expect(webTablesPage.registrationModal).toBeHidden();
    await pauseOneSecond(sharedPage);

    await expect(webTablesPage.findRowByEmail(originalRecord.email)).toBeHidden();
    const updatedRow = webTablesPage.findRowByEmail(updatedRecord.email);
    await expect(updatedRow).toBeVisible();
    await pauseOneSecond(sharedPage);
    const savedUpdatedRecord = await webTablesPage.getRowRecord(updatedRow);
    console.log(`[TEST6] Updated row data: ${JSON.stringify(savedUpdatedRecord)}`);
    // Compare the saved updated record with the expected updated record.
    expect(savedUpdatedRecord).toEqual(updatedRecord);
    console.log('[TEST6] Edited record was persisted correctly');
    await pauseOneSecond(sharedPage);

    // Click the Trash icon for one of the records currently visible in the
    // table. In this case, the edited row is still visible, so it is the record
    // selected for deletion.
    console.log('[TEST6] Clicking the visible Trash icon for the edited record');
    await webTablesPage.deleteRow(updatedRow);
    await pauseOneSecond(sharedPage);
    await expect(webTablesPage.findRowByEmail(updatedRecord.email)).toBeHidden();

    const finalCount = await webTablesPage.getTotalRecordsCount();
    console.log(`[TEST6] Records found after deleting the edited row: ${finalCount}`);
    expect(finalCount).toBe(initialCount - 1);

    await pauseOneSecond(sharedPage);
    console.log('[TEST6] ✓ Edit and delete actions verified successfully');
  });
});

