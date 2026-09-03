import { expect, test } from '@playwright/test';
import { AccountApi } from '../apiClients/AccountApi';
import { BookStoreApi } from '../apiClients/BookStoreApi';
import { generateUniqueCredentials } from '../utils/apiTestData.utils';

type Book = {
  isbn: string;
  title: string;
  subTitle: string;
  author: string;
  publish_date: string;
  publisher: string;
  pages: number;
  description: string;
  website: string;
};

/**
 * Book Store API suite for DemoQA.
 * Scope: Validate book endpoints without launching a browser.
 *
 * Author: Marcos Urzua
 */
test.describe.serial('BOOK STORE API: catalog and user collection', () => {
  const credentials = generateUniqueCredentials();
  let createdUserId: string | undefined;
  let cleanupToken: string | undefined;

  // Cleanup after each test to ensure no residual data affects subsequent tests
  test.afterEach(async ({ request }) => {
    if (!createdUserId || !cleanupToken) return;

    const accountApi = new AccountApi(request);
    const deleteEndpoint = `/Account/v1/User/${createdUserId}`;
    console.log(`[TEARDOWN] DELETE endpoint: ${deleteEndpoint}`);
    const deleteResponse = await accountApi.deleteUser(createdUserId, cleanupToken);
    expect(deleteResponse.status()).toBe(204);
    createdUserId = undefined;
    cleanupToken = undefined;
    console.log('[TEARDOWN] Test user deleted successfully');
  });

  // ========== GET BOOKS ==========

  /**
   * Test 1: Get the public book catalog
   * Scope: Verify that DemoQA returns the available books without authentication.
   * Validations:
   * - Response status is 200 OK
   * - Response contains a non-empty books collection
   * - Every book contains the expected catalog fields
   */
  test('test1 - GET BOOKS: returns the public book catalog', async ({ request }) => {
    const bookStoreApi = new BookStoreApi(request);
    const getBooksEndpoint = '/BookStore/v1/Books';

    console.log(`[TEST1] GET endpoint: ${getBooksEndpoint}`);
    const getBooksResponse = await bookStoreApi.getBooks();
    console.log(`[TEST1] Get Books response status: ${getBooksResponse.status()}`);
    expect(getBooksResponse.status()).toBe(200);

    const responseBody = await getBooksResponse.json() as { books: Book[] };
    console.log(`[TEST1] Books returned: ${responseBody.books.length}\n`);
    expect(responseBody.books.length).toBeGreaterThan(0);

    // Validate that each book contains the expected catalog fields
    for (const book of responseBody.books) {
      expect(book.isbn).toBeTruthy();
      expect(book.title).toBeTruthy();
      expect(book.author).toBeTruthy();
      expect(book.publisher).toBeTruthy();
      expect(book.pages).toBeGreaterThan(0);
      expect(book.website).toBeTruthy();
      
      console.log(`[TEST1] Validated book: ${book.title} | Author: ${book.author} | Publisher: ${book.publisher}\n`);
    };

    console.log('[TEST1] ✓ Public book catalog returned successfully\n');
  });

  // ========== ADD BOOKS ==========

  /**
   * Test 2: Add a book to a user collection
   * Scope: Verify that DemoQA assigns a valid catalog ISBN to an authenticated user.
   * Validations:
   * - User and token preconditions are created successfully
   * - POST response status is 201 Created
   * - POST response contains the assigned ISBN
   * - GET User confirms that the book was persisted in the collection
   */
  test('test2 - POST BOOKS: adds a catalog book to a user collection', async ({ request }) => {
    const accountApi = new AccountApi(request); // Initializes the Account API client with the provided request context
    const bookStoreApi = new BookStoreApi(request); // Initializes the Book Store API client with the provided request context

    console.log(`[TEST2] Creating prerequisite API user: ${credentials.userName}`);
    // Create a new user as a prerequisite for adding books to their collection
    const createResponse = await accountApi.createUser(credentials); 
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json() as { userID: string };
    createdUserId = createdUser.userID;
    expect(createdUserId).toBeTruthy();

    console.log('[TEST2] Generating the token required to add books');
    const tokenResponse = await accountApi.generateToken(credentials);
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json() as { token: string; status: string };
    expect(tokenBody.status).toBe('Success');
    expect(tokenBody.token).toBeTruthy();
    cleanupToken = tokenBody.token;

    // The public catalog provides a valid ISBN for the POST precondition.
    const catalogResponse = await bookStoreApi.getBooks();
    expect(catalogResponse.status()).toBe(200);
    // Ensure that the catalog contains at least one book before selecting an ISBN for the POST request
    const catalog = await catalogResponse.json() as { books: Book[] }; // Parses the catalog response to extract the list of books
    expect(catalog.books.length).toBeGreaterThan(0);
    const selectedBook = catalog.books[0]; // Selects the first book from the catalog to add to the user's collection

    const postBooksEndpoint = '/BookStore/v1/Books'; // Defines the endpoint for adding books to the user's collection
    console.log(`[TEST2] POST endpoint: ${postBooksEndpoint}`);
    console.log(`[TEST2] Adding ISBN ${selectedBook.isbn} to user ${createdUserId}`);
    // Add the selected book to the user's collection using the Book Store API
    const addBooksResponse = await bookStoreApi.addBooks(createdUserId, [selectedBook.isbn], cleanupToken);
    console.log(`[TEST2] Add Books response status: ${addBooksResponse.status()}`);
    expect(addBooksResponse.status()).toBe(201); // Verifies that the book was successfully added to the user's collection

    const addBooksBody = await addBooksResponse.json() as { books: { isbn: string }[] }; // Parses the response body to extract the list of books in the user's collection
    
    expect(addBooksBody.books).toContainEqual({ isbn: selectedBook.isbn }); // Verifies that the added book is present in the user's collection
    console.log(`[TEST2] Added book: ${JSON.stringify(addBooksBody.books)}`); // Logs the list of books in the user's collection after the addition
    
    console.log('[TEST2] Getting the user to verify the persisted collection');
    // Retrieve the user to verify that the added book is persisted in the user's collection
    const getUserResponse = await accountApi.getUser(createdUserId, cleanupToken);
    expect(getUserResponse.status()).toBe(200);
    // Ensure that the response contains the user's collection of books
    const returnedUser = await getUserResponse.json() as { books: Book[] }; // Parses the response body to extract the user's collection of books
   
    // Verify that the added book is present in the user's persisted collection of books
    const bookWasPersisted = returnedUser.books.some((currentBook) => {
      return currentBook.isbn === selectedBook.isbn;
    });
    expect(bookWasPersisted).toBe(true);

    console.log(`[TEST2] ✓ ISBN ${selectedBook.isbn} was added and persisted successfully`);
  });

  // ========== DELETE ALL BOOKS ==========

  /**
   * Test 3: Delete all books from a user collection
   * Scope: Verify that DemoQA clears the collection of an authenticated user.
   * Validations:
   * - A user, token, and non-empty collection are created successfully
   * - DELETE response status is 204 No Content
   * - GET User confirms that the collection is empty
   */
  test('test3 - DELETE BOOKS: clears a user collection', async ({ request }) => {
    const accountApi = new AccountApi(request);
    const bookStoreApi = new BookStoreApi(request);

    console.log(`[TEST3] Creating prerequisite API user: ${credentials.userName}`);
    const createResponse = await accountApi.createUser(credentials);
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json() as { userID: string };
    createdUserId = createdUser.userID;
    expect(createdUserId).toBeTruthy();

    console.log('[TEST3] Generating the token required to manage the collection');
    const tokenResponse = await accountApi.generateToken(credentials);
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json() as { token: string; status: string };
    expect(tokenBody.status).toBe('Success');
    expect(tokenBody.token).toBeTruthy();
    cleanupToken = tokenBody.token;

    // Add one catalog book so DELETE operates on a non-empty collection.
    const catalogResponse = await bookStoreApi.getBooks();
    expect(catalogResponse.status()).toBe(200);
    const catalog = await catalogResponse.json() as { books: Book[] };
    expect(catalog.books.length).toBeGreaterThan(0);
    const selectedBook = catalog.books[0];

    console.log(`[TEST3] Adding prerequisite ISBN ${selectedBook.isbn}`);
    const addBooksResponse = await bookStoreApi.addBooks(createdUserId, [selectedBook.isbn], cleanupToken);
    expect(addBooksResponse.status()).toBe(201);

    const deleteBooksEndpoint = `/BookStore/v1/Books?UserId=${createdUserId}`;
    console.log(`[TEST3] DELETE endpoint: ${deleteBooksEndpoint}`);
    const deleteBooksResponse = await bookStoreApi.deleteAllBooks(createdUserId, cleanupToken);
    console.log(`[TEST3] Delete Books response status: ${deleteBooksResponse.status()}`);
    expect(deleteBooksResponse.status()).toBe(204);

    console.log('[TEST3] Getting the user to verify the collection is empty');
    const getUserResponse = await accountApi.getUser(createdUserId, cleanupToken);
    expect(getUserResponse.status()).toBe(200);
    const returnedUser = await getUserResponse.json() as { books: Book[] };
    expect(returnedUser.books).toEqual([]); // Verify that the user's book collection is empty after deletion 

    console.log('[TEST3] ✓ User collection was cleared successfully');
  });

  // ========== DELETE ONE BOOK ==========

  /**
   * Test 4: Delete one book from a user collection
   * Scope: Verify that DemoQA removes only the requested ISBN.
   * Validations:
   * - A user, token, and collection with two books are created successfully
   * - DELETE response status is 204 No Content
   * - GET User confirms the selected book was removed
   * - GET User confirms the other book remains in the collection
   */
  test('test4 - DELETE BOOK: removes one book from a user collection', async ({ request }) => {
    const accountApi = new AccountApi(request);
    const bookStoreApi = new BookStoreApi(request);

    console.log(`[TEST4] Creating prerequisite API user: ${credentials.userName}`);
    const createResponse = await accountApi.createUser(credentials);
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json() as { userID: string };
    createdUserId = createdUser.userID;
    expect(createdUserId).toBeTruthy();

    console.log('[TEST4] Generating the token required to manage the collection');
    const tokenResponse = await accountApi.generateToken(credentials);
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json() as { token: string; status: string };
    expect(tokenBody.status).toBe('Success');
    expect(tokenBody.token).toBeTruthy();
    cleanupToken = tokenBody.token;

    const catalogResponse = await bookStoreApi.getBooks(); // Fetches the public book catalog from the Book Store API
    expect(catalogResponse.status()).toBe(200);
    // 
    const catalog = await catalogResponse.json() as { books: Book[] };
    // Parses the catalog response to extract the list of books
    expect(catalog.books.length).toBeGreaterThanOrEqual(2);
    const bookToDelete = catalog.books[0]; // Selects the first book in the catalog to be deleted
    const bookToKeep = catalog.books[1]; // Selects the second book in the catalog to be kept

    console.log(`[TEST4] Adding prerequisite ISBNs ${bookToDelete.isbn} and ${bookToKeep.isbn}`);

    // Adds the selected books to the user's collection
    const addBooksResponse = await bookStoreApi.addBooks(
      createdUserId,
      [bookToDelete.isbn, bookToKeep.isbn],
      cleanupToken
    );
    expect(addBooksResponse.status()).toBe(201); // Verifies that the books were successfully added to the user's collection

    const deleteBookEndpoint = '/BookStore/v1/Book';
    console.log(`[TEST4] DELETE endpoint: ${deleteBookEndpoint}`);
    console.log(`[TEST4] Deleting ISBN ${bookToDelete.isbn} from user ${createdUserId}`);
    // Deletes the selected book from the user's collection
    const deleteBookResponse = await bookStoreApi.deleteBook(
      createdUserId,
      bookToDelete.isbn,
      cleanupToken
    );

    console.log(`[TEST4] Delete Book response status: ${deleteBookResponse.status()}`);
    expect(deleteBookResponse.status()).toBe(204); // Verifies that the book was successfully deleted from the user's collection

    console.log('[TEST4] Getting the user to verify the remaining collection');
    // Retrieves the user's information to verify the remaining collection after the deletion
    const getUserResponse = await accountApi.getUser(createdUserId, cleanupToken);
    expect(getUserResponse.status()).toBe(200); 
    // Parses the response to extract the user's collection of books
    const returnedUser = await getUserResponse.json() as { books: Book[] };

    // Checks if the deleted book is still present in the user's collection
    const deletedBookWasFound = returnedUser.books.some((currentBook) => {
      return currentBook.isbn === bookToDelete.isbn;
    });
    
    // Checks if the remaining book is still present in the user's collection
    const remainingBookWasFound = returnedUser.books.some((currentBook) => {
      return currentBook.isbn === bookToKeep.isbn;
    });

    expect(deletedBookWasFound).toBe(false); // Verifies that the deleted book is no longer present in the user's collection
    expect(remainingBookWasFound).toBe(true); // Verifies that the remaining book is still present in the user's collection
    expect(returnedUser.books).toHaveLength(1); // Verifies that there is only one book left in the user's collection

    console.log(`[TEST4] ✓ ISBN ${bookToDelete.isbn} was removed and ISBN ${bookToKeep.isbn} remains`);
  });

  // ========== REPLACE ONE BOOK ==========

  /**
   * Test 5: Replace one book in a user collection
   * Scope: Verify that DemoQA replaces an existing ISBN with another catalog ISBN.
   * Validations:
   * - A user, token, and collection with one book are created successfully
   * - PUT response status is 200 OK
   * - PUT response contains the replacement ISBN
   * - GET User confirms the original book was removed and the replacement remains
   */
  test('test5 - PUT BOOK: replaces one book in a user collection', async ({ request }) => {
    const accountApi = new AccountApi(request);
    const bookStoreApi = new BookStoreApi(request);

    console.log(`[TEST5] Creating prerequisite API user: ${credentials.userName}`);
    const createResponse = await accountApi.createUser(credentials);
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json() as { userID: string };
    createdUserId = createdUser.userID;
    expect(createdUserId).toBeTruthy();

    console.log('[TEST5] Generating the token required to manage the collection');
    const tokenResponse = await accountApi.generateToken(credentials);
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json() as { token: string; status: string };
    expect(tokenBody.status).toBe('Success');
    expect(tokenBody.token).toBeTruthy();
    cleanupToken = tokenBody.token;

    const catalogResponse = await bookStoreApi.getBooks(); // Fetches the public book catalog from the Book Store API
    expect(catalogResponse.status()).toBe(200);
    // Parses the catalog response to extract the list of books
    const catalog = await catalogResponse.json() as { books: Book[] };
    // Ensures that there are at least two books available in the catalog for the test
    expect(catalog.books.length).toBeGreaterThanOrEqual(2);
    const originalBook = catalog.books[0]; // Selects the first book from the catalog as the original book for the test
    const replacementBook = catalog.books[1]; // Selects the second book from the catalog as the replacement book for the test

    console.log(`[TEST5] Adding prerequisite ISBN ${originalBook.isbn}`);
    // Adds the original book to the user's collection as a prerequisite for the replacement test
    const addBooksResponse = await bookStoreApi.addBooks(
      createdUserId,
      [originalBook.isbn],
      cleanupToken
    );
    expect(addBooksResponse.status()).toBe(201);

    // Constructs the endpoint URL for replacing the original book with the replacement book
    const replaceBookEndpoint = `/BookStore/v1/Books/${originalBook.isbn}`;
    console.log(`[TEST5] PUT endpoint: ${replaceBookEndpoint}`);
    console.log(`[TEST5] Replacing ISBN ${originalBook.isbn} with ${replacementBook.isbn}`);

    // Sends the request to replace the original book with the replacement book in the user's collection
    const replaceBookResponse = await bookStoreApi.replaceBook(
      createdUserId,
      originalBook.isbn,
      replacementBook.isbn,
      cleanupToken
    );
    console.log(`[TEST5] Replace Book response status: ${replaceBookResponse.status()}`);
    expect(replaceBookResponse.status()).toBe(200);

    const replaceBookBody = await replaceBookResponse.json() as { books: Book[] };
    const replacementWasReturned = replaceBookBody.books.some((currentBook) => {
      return currentBook.isbn === replacementBook.isbn;
    });
    expect(replacementWasReturned).toBe(true);

    console.log('[TEST5] Getting the user to verify the persisted replacement');

    // Verifies that the replacement book has been persisted in the user's collection
    const getUserResponse = await accountApi.getUser(createdUserId, cleanupToken);
    expect(getUserResponse.status()).toBe(200);
    
    // Parses the response to extract the user's collection of books
    const returnedUser = await getUserResponse.json() as { books: Book[] };
    
    // Checks whether the original book and the replacement book are present in the user's collection
    const originalBookWasFound = returnedUser.books.some((currentBook) => {
      return currentBook.isbn === originalBook.isbn;
    });

    // Checks whether the replacement book is present in the user's collection
    const replacementBookWasFound = returnedUser.books.some((currentBook) => {
      return currentBook.isbn === replacementBook.isbn;
    });

    expect(originalBookWasFound).toBe(false); // The original book should no longer be present in the user's collection
    console.log(`[TEST5] The original book was not found in the user's collection`);
    expect(replacementBookWasFound).toBe(true); // The replacement book should be present in the user's collection
    console.log(`[TEST5] The replacement book(ISBN: ${replacementBook.isbn}) was found in the user's collection`);
    expect(returnedUser.books).toHaveLength(1);

    console.log(`[TEST5] ✓ ISBN ${originalBook.isbn} was replaced by ISBN ${replacementBook.isbn}`);
  });
});
