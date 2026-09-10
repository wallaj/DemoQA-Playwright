import { expect, test, type APIRequestContext } from '@playwright/test';
import { AccountApi } from '../apiClients/AccountApi';
import { BookStoreApi } from '../apiClients/BookStoreApi';
import { generateUniqueCredentials } from '../utils/apiTestData.utils';

const unknownIsbn = '9781234567899';
const invalidToken = 'invalid-token';

async function createAuthenticatedUser(request: APIRequestContext) {
  const accountApi = new AccountApi(request);
  const credentials = generateUniqueCredentials();
  const createResponse = await accountApi.createUser(credentials); // Create a new user with unique credentials
  expect(createResponse.status()).toBe(201); // Expecting a 201 Created for the new user
  const createdUser = await createResponse.json() as { userID: string };
  const tokenResponse = await accountApi.generateToken(credentials); // Generate a token for the created user
  expect(tokenResponse.status()).toBe(200); // Expecting a 200 OK for token generation
  const tokenBody = await tokenResponse.json() as { token: string }; // Extract the token from the response

  return { accountApi, userId: createdUser.userID, token: tokenBody.token }; // Return the API client, user ID, and token for further use
}

/**
 * Negative Book Store API coverage for documented error responses.
 * Scope: Validate malformed, unauthorized, and unknown-resource requests.
 * Author: Marcos Urzúa
 */
test.describe('BOOK STORE API: negative cases', () => {
  test('test1 - POST BOOKS: returns 500 for an invalid request body', async ({ request }) => {
    // Attempt to add books with an invalid request body
    const response = await request.post('/BookStore/v1/Books', { data: {} });

    console.log(`[TEST1] POST /BookStore/v1/Books response status: ${response.status()}`);
    expect(response.status()).toBe(500); // DemoQA returns an internal server error for an empty request body
    console.log(`[TEST1] POST /BookStore/v1/Books response body: ${await response.text()} ${response.status()}`); // Log the response body for debugging purposes
  });

  test('test2 - POST BOOKS: returns 401 without a valid token', async ({ request }) => {
    // Attempt to add books without a valid token
    const { accountApi, userId, token } = await createAuthenticatedUser(request);
    const bookStoreApi = new BookStoreApi(request);

    try {
      // Use an invalid token to attempt adding books
      const response = await bookStoreApi.addBooks(userId, [unknownIsbn], invalidToken); // Attempt to add books with an invalid token
      console.log(`[TEST2] POST /BookStore/v1/Books response status: ${response.status()}`);
      expect(response.status()).toBe(401); // Expecting a 401 Unauthorized for invalid token
    } finally {
      const deleteResponse = await accountApi.deleteUser(userId, token); // Clean up by deleting the created user
      expect(deleteResponse.status()).toBe(204); // Expecting a 204 No Content for successful deletion
      console.log(`[TEST2] DELETE /Account/v1/User response status: ${await deleteResponse.text()} ${deleteResponse.status()}`); // Log the response status for debugging purposes
    }
  });

  test('test3 - POST BOOKS: returns 400 for an unavailable ISBN', async ({ request }) => {
    const { accountApi, userId, token } = await createAuthenticatedUser(request); // Create an authenticated user for testing
    const bookStoreApi = new BookStoreApi(request); // Initialize the Book Store API client for testing

    try {
      const response = await bookStoreApi.addBooks(userId, [unknownIsbn], token); // Attempt to add an unavailable ISBN to the valid user's collection
      console.log(`[TEST3] POST /BookStore/v1/Books response status: ${response.status()}`);
      expect(response.status()).toBe(400); // DemoQA reports an unavailable ISBN as a bad request
      console.log(`[TEST3] POST /BookStore/v1/Books response body: ${await response.text()} ${response.status()}`); // Log the response body for debugging purposes
    } finally {
      const deleteResponse = await accountApi.deleteUser(userId, token); // Clean up by deleting the created user
      expect(deleteResponse.status()).toBe(204); // Expecting a 204 No Content for successful deletion
      console.log(`[TEST3] DELETE /Account/v1/User response status: ${await deleteResponse.text()} ${deleteResponse.status()}`); // Log the response status for debugging purposes
    }
  });

  test('test4 - DELETE BOOKS: returns 401 without a user ID', async ({ request }) => {
    const { accountApi, userId, token } = await createAuthenticatedUser(request); // Create an authenticated user for testing

    try {
      const response = await request.delete('/BookStore/v1/Books', { // Attempt to delete books without providing a user ID
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`[TEST4] DELETE /BookStore/v1/Books response status: ${response.status()}`);
      expect(response.status()).toBe(401); // DemoQA reports a missing user ID as unauthorized for this endpoint
      console.log(`[TEST4] DELETE /BookStore/v1/Books response body: ${await response.text()} ${response.status()}`); // Log the response body for debugging purposes
    } finally {
      const deleteResponse = await accountApi.deleteUser(userId, token); // Clean up the created user
      expect(deleteResponse.status()).toBe(204); // Expecting a 204 No Content for successful deletion
    }
  });

  test('test5 - DELETE BOOKS: returns 401 without a valid token', async ({ request }) => {
    const { accountApi, userId, token } = await createAuthenticatedUser(request); // Create an authenticated user for testing
    const bookStoreApi = new BookStoreApi(request); // Initialize the Book Store API client for testing

    try {
      const response = await bookStoreApi.deleteAllBooks(userId, invalidToken); // Attempt to delete all books with an invalid token
      console.log(`[TEST5] DELETE /BookStore/v1/Books response status: ${response.status()}`);
      expect(response.status()).toBe(401); // Expecting a 401 Unauthorized for deletion without a valid token
      console.log(`[TEST5] DELETE /BookStore/v1/Books response body: ${await response.text()} ${response.status()}`); // Log the response body for debugging purposes
    } finally {
      const deleteResponse = await accountApi.deleteUser(userId, token); // Clean up by deleting the created user
      expect(deleteResponse.status()).toBe(204); // Expecting a 204 No Content for successful deletion
      console.log(`[TEST5] DELETE /Account/v1/User response status: ${await deleteResponse.text()} ${deleteResponse.status()}`); // Log the response status for debugging purposes
    }
  });
  

  test('test6 - GET BOOK: returns 400 for an unavailable ISBN', async ({ request }) => {
    const bookStoreApi = new BookStoreApi(request);
    const response = await bookStoreApi.getBook(unknownIsbn); // Attempt to get a book with an unknown ISBN

    console.log(`[TEST6] GET /BookStore/v1/Book response status: ${response.status()}`);
    expect(response.status()).toBe(400); // DemoQA reports an unavailable ISBN as a bad request
    console.log(`[TEST6] GET /BookStore/v1/Book response body: ${await response.text()} ${response.status()}`); // Log the response body for debugging purposes
  });

  test('test7 - DELETE BOOK: returns 500 for an invalid request body', async ({ request }) => {
    const { accountApi, userId, token } = await createAuthenticatedUser(request);

    try {
      const response = await request.delete('/BookStore/v1/Book', {
        headers: { Authorization: `Bearer ${token}` },
        data: {},
      });  // Attempt to delete a book with an invalid request body

      console.log(`[TEST7] DELETE /BookStore/v1/Book response status: ${response.status()}`);
      expect(response.status()).toBe(500); // DemoQA returns an internal server error for an empty request body
      console.log(`[TEST7] DELETE /BookStore/v1/Book response body status: ${response.status()}`); // Log the response body for debugging purposes
    } finally {
      const deleteResponse = await accountApi.deleteUser(userId, token);
      expect(deleteResponse.status()).toBe(204);
    }
  });

  test('test8 - DELETE BOOK: returns 401 without a valid token', async ({ request }) => {
    const { accountApi, userId, token } = await createAuthenticatedUser(request);
    const bookStoreApi = new BookStoreApi(request);

    try {
      const response = await bookStoreApi.deleteBook(userId, unknownIsbn, invalidToken); // Attempt to delete a book without a valid token
      console.log(`[TEST8] DELETE /BookStore/v1/Book response status: ${response.status()}`);
      expect(response.status()).toBe(401); // Expecting a 401 Unauthorized for deletion without a valid token
    } finally {
      const deleteResponse = await accountApi.deleteUser(userId, token);
      expect(deleteResponse.status()).toBe(204); // Expecting a 204 No Content for successful deletion
      console.log(`[TEST8] DELETE /Account/v1/User response status: ${await deleteResponse.text()} ${deleteResponse.status()}`); // Log the response status for debugging purposes
    }
  });

  test('test9 - DELETE BOOK: returns 400 for an unavailable ISBN', async ({ request }) => {
    const { accountApi, userId, token } = await createAuthenticatedUser(request);
    const bookStoreApi = new BookStoreApi(request);

    try {
      const response = await bookStoreApi.deleteBook(userId, unknownIsbn, token); // Attempt to delete a book with an unknown ISBN
      console.log(`[TEST9] DELETE /BookStore/v1/Book response status: ${response.status()}`);
      expect(response.status()).toBe(400); // DemoQA reports an unavailable ISBN as a bad request
    } finally {
      const deleteResponse = await accountApi.deleteUser(userId, token); // Clean up by deleting the created user
      expect(deleteResponse.status()).toBe(204); // Expecting a 204 No Content for successful deletion
      console.log(`[TEST9] DELETE /Account/v1/User response status: ${await deleteResponse.text()} ${deleteResponse.status()}`); // Log the response status for debugging purposes
    }
  });

  test('test10 - PUT BOOK: returns 400 for an invalid request body', async ({ request }) => {
    const response = await request.put(`/BookStore/v1/Books/${unknownIsbn}`, { data: {} }); // Attempt to update a book with an invalid request body

    console.log(`[TEST10] PUT /BookStore/v1/Books/{ISBN} response status: ${response.status()}`);
    expect(response.status()).toBe(400);
  });

  test('test11 - PUT BOOK: returns 401 without a valid token', async ({ request }) => {
    const { accountApi, userId, token } = await createAuthenticatedUser(request);
    const bookStoreApi = new BookStoreApi(request); // Initialize the BookStore API client

    try {
      const catalogResponse = await bookStoreApi.getBooks();
      expect(catalogResponse.status()).toBe(200);
      const catalog = await catalogResponse.json() as { books: { isbn: string }[] };
      const validIsbn = catalog.books[0].isbn;
      // Attempt to replace a valid catalog book without a valid token
      const response = await bookStoreApi.replaceBook(userId, validIsbn, validIsbn, invalidToken);
      console.log(`[TEST11] PUT /BookStore/v1/Books/{ISBN} response status: ${response.status()}`);
      expect(response.status()).toBe(401); // Expecting a 401 Unauthorized for replacing a book without a valid token
    } finally {
      const deleteResponse = await accountApi.deleteUser(userId, token); // Clean up by deleting the created user
      expect(deleteResponse.status()).toBe(204); // Expecting a 204 No Content for successful deletion
      console.log(`[TEST11] DELETE /Account/v1/User response status: ${await deleteResponse.text()} ${deleteResponse.status()}`); // Log the response status for debugging purposes
    }
  });
});
