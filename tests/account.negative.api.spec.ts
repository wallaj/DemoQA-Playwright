import { expect, test } from '@playwright/test';
import { AccountApi } from '../apiClients/AccountApi';
import { generateUniqueCredentials } from '../utils/apiTestData.utils';

const unknownUserId = '00000000-0000-0000-0000-000000000000';

/**
 * Negative Account API coverage for documented error responses.
 * Scope: Validate malformed, unauthorized, and unknown-user requests.
 * Author: Marcos Urzúa
 */
test.describe('ACCOUNT API: negative cases', () => {
  test('test1 - AUTHORIZED: returns 400 for an invalid request body', async ({ request }) => {
    const accountApi = new AccountApi(request);
    // Attempt to authorize with an invalid request body
    const response = await accountApi.isAuthorized({ userName: '', password: '' });

    console.log(`[TEST1] POST /Account/v1/Authorized response status: ${response.status()}`);
    expect(response.status()).toBe(400); // Expecting a 400 Bad Request for invalid request body
  });

  test('test2 - AUTHORIZED: returns 404 for unknown credentials', async ({ request }) => {
    const accountApi = new AccountApi(request);
    // Attempt to authorize with unknown credentials
    const response = await accountApi.isAuthorized({
      userName: `unknown_${Date.now()}`,
      password: 'DemoQA@UnknownAa1',
    });

    console.log(`[TEST2] POST /Account/v1/Authorized response status: ${response.status()}`);
    expect(response.status()).toBe(404); // Expecting a 404 Not Found for unknown credentials
  });

  test('test3 - GENERATE TOKEN: returns 400 for an invalid request body', async ({ request }) => {
    const accountApi = new AccountApi(request);
    // Attempt to generate a token with an invalid request body
    const response = await accountApi.generateToken({ userName: '', password: '' });

    console.log(`[TEST3] POST /Account/v1/GenerateToken response status: ${response.status()}`);
    expect(response.status()).toBe(400); // Expecting a 400 Bad Request for invalid request body
  });

  test('test4 - CREATE USER: returns 400 for an invalid request', async ({ request }) => {
    // Attempt to create a user with an invalid request body
    const response = await request.post('/Account/v1/User', {
      data: { userName: `invalid_${Date.now()}` },
    });
    console.log(`[TEST4] POST /Account/v1/User response status: ${response.status()}`);
    expect(response.status()).toBe(400); // DemoQA reports the incomplete request body as Bad Request
  });

  test('test5 - CREATE USER: returns 406 for a duplicate username', async ({ request }) => {
    const accountApi = new AccountApi(request);
    const credentials = generateUniqueCredentials();
    const firstResponse = await accountApi.createUser(credentials); // Create the first user with unique credentials
    expect(firstResponse.status()).toBe(201); // Expecting a 201 Created for the first user creation 

    const duplicateResponse = await accountApi.createUser(credentials); // Attempt to create a user with duplicate credentials
    console.log(`[TEST5] POST /Account/v1/User response status: ${duplicateResponse.status()}`);
    expect(duplicateResponse.status()).toBe(406); // Expecting a 406 Not Acceptable for duplicate username

    const createdUser = await firstResponse.json() as { userID: string }; // Extract the created user's ID from the first response
    const tokenResponse = await accountApi.generateToken(credentials); // Generate a token for the created user
    const tokenBody = await tokenResponse.json() as { token: string }; // Extract the token from the response
    const deleteResponse = await accountApi.deleteUser(createdUser.userID, tokenBody.token); // Delete the created user
    expect(deleteResponse.status()).toBe(204); // Expecting a 204 No Content for successful deletion
  });

  test('test6 - DELETE USER: returns 401 for an existing user without a valid token', async ({ request }) => {
    const accountApi = new AccountApi(request);
    const credentials = generateUniqueCredentials();
    const createResponse = await accountApi.createUser(credentials);
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json() as { userID: string };
    const tokenResponse = await accountApi.generateToken(credentials);
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json() as { token: string };

    try {
      // Attempt to delete an existing user with an invalid token.
      const response = await accountApi.deleteUser(createdUser.userID, 'invalid-token');

      console.log(`[TEST6] DELETE /Account/v1/User/{UUID} response status: ${response.status()}`);
      expect(response.status()).toBe(401); // Expecting a 401 Unauthorized for an invalid token
    } finally {
      const cleanupResponse = await accountApi.deleteUser(createdUser.userID, tokenBody.token);
      expect(cleanupResponse.status()).toBe(204);
    }
  });

  test('test7 - GET USER: returns 401 without a valid token', async ({ request }) => {
    const accountApi = new AccountApi(request);
    // Attempt to get a user without a valid token
    const response = await accountApi.getUser(unknownUserId, 'invalid-token');

    console.log(`[TEST7] GET /Account/v1/User/{UUID} response status: ${response.status()}`);
    expect(response.status()).toBe(401);
  });
});
