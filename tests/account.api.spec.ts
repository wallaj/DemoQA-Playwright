import { expect, test } from '@playwright/test';
import { AccountApi } from '../apiClients/AccountApi';
import { generateUniqueCredentials } from '../utils/apiTestData.utils';

/**
 * Account API suite for DemoQA.
 * Scope: Validate account endpoints without launching a browser.
 *
 * Author: Marcos Urzua
 */
test.describe.serial('ACCOUNT API: user lifecycle', () => {
  const credentials = generateUniqueCredentials();
  let createdUserId: string | undefined; // Store the created user ID for cleanup
  let cleanupToken: string | undefined; // Store the token for cleanup (to delete the user)

  test.afterEach(async ({ request }) => {
    if (!createdUserId || !cleanupToken) {
      console.log('[TEARDOWN] No authenticated test user is available for cleanup');
      return;
    }

    const deleteEndpoint = `/Account/v1/User/${createdUserId}`;
    console.log(`[TEARDOWN] DELETE endpoint: ${deleteEndpoint}`);
    console.log(`[TEARDOWN] Deleting test user: ${credentials.userName}, userID: ${createdUserId}`);
    const cleanupApi = new AccountApi(request);
    const deleteResponse = await cleanupApi.deleteUser(createdUserId, cleanupToken);
    expect(deleteResponse.status()).toBe(204);
    createdUserId = undefined;
    cleanupToken = undefined;
    console.log('[TEARDOWN] Test user deleted successfully');
  });

  // ========== CREATE USER ==========

  /**
   * Test 1: Create a valid user
   * Scope: Verify that DemoQA creates a user from unique valid credentials.
   * Validations:
   * - Response status is 201 Created
   * - Response contains a user ID and the submitted username
   * - The new user starts with an empty book collection
   */
  test('test1 - CREATE USER: creates a valid account', async ({ request }) => {
    const accountApi = new AccountApi(request);
    console.log(`[TEST1] Creating unique API user: ${credentials.userName}`);

    // Create a new user via the AccountApi class
    // The createUser method sends a POST request to the /Account/v1/User endpoint with the provided credentials.
    const createResponse = await accountApi.createUser(credentials);

    console.log(`[TEST1] Create User response status: ${createResponse.status()}`);
    expect(createResponse.status()).toBe(201);

    // Parse the response body to extract the created user details
    const createdUser = await createResponse.json() as {
      userID: string;
      username: string;
      books: unknown[];
    };
    // Store the created user ID for cleanup in the afterEach hook
    createdUserId = createdUser.userID;

    const tokenResponse = await accountApi.generateToken(credentials);
    expect(tokenResponse.status()).toBe(200); // Validate that the token generation was successful
    const tokenBody = await tokenResponse.json() as { token: string; status: string };
    expect(tokenBody.status).toBe('Success'); // Validate that the token generation was successful
    expect(tokenBody.token).toBeTruthy(); // Validate that a token was returned
    cleanupToken = tokenBody.token; // Store the token for cleanup in the afterEach hook

    console.log(`[TEST1] Created user ID: ${createdUser.userID}`);
    expect(createdUser.userID).toBeTruthy(); // Validate that a user ID was returned
    expect(createdUser.username).toBe(credentials.userName); // Validate that the returned username matches the submitted username
    expect(createdUser.books).toEqual([]); // Validate that the new user starts with an empty book collection

    console.log('[TEST1] ✓ User account created with the expected response successfully');
  });

  // ========== GENERATE TOKEN ==========

  /**
   * Test 2: Generate a valid authentication token
   * Scope: Verify that DemoQA generates a token for an existing user.
   * Validations:
   * - Response status is 200 OK
   * - Response reports a successful authorization
   * - Response contains a non-empty token and expiration date
   */
  test('test2 - GENERATE TOKEN: returns a valid token for an existing user', async ({ request }) => {
    const accountApi = new AccountApi(request);
    console.log(`[TEST2] Creating prerequisite API user: ${credentials.userName}`);

    // GenerateToken requires an account that already exists.
    const createResponse = await accountApi.createUser(credentials);
    // Validate that the user creation was successful before attempting to generate a token
    expect(createResponse.status()).toBe(201);
    // Extract the created user ID from the response for cleanup purposes
    const createdUser = await createResponse.json() as { userID: string };
    expect(createdUser.userID).toBeTruthy(); // Validate that a user ID was returned
    // Store the created user ID for cleanup in the afterEach hook
    createdUserId = createdUser.userID;

    console.log('[TEST2] Requesting an authentication token with valid credentials');
    // Request an authentication token using the valid credentials of the newly created user
    const tokenResponse = await accountApi.generateToken(credentials);
    console.log(`[TEST2] Generate Token response status: ${tokenResponse.status()}`);
    // Validate that the token generation was successful before extracting the token body
    expect(tokenResponse.status()).toBe(200);

    // Extract the token body from the response for further validations
    const tokenBody = await tokenResponse.json() as {
      token: string;
      expires: string;
      status: string;
      result: string;
    };
    // Store the extracted token for cleanup or further use
    cleanupToken = tokenBody.token;

    console.log(`[TEST2] Token status: ${tokenBody.status}`);
    // Validate the contents of the token body to ensure it meets the expected structure and values
    expect(tokenBody.status).toBe('Success');
    // Validate that the token indicates a successful authorization
    expect(tokenBody.result).toContain('authorized successfully');
    // Validate that the token and expiration date are present and correctly formatted
    expect(tokenBody.token).toBeTruthy();
    expect(Number.isNaN(Date.parse(tokenBody.expires))).toBe(false);

   
    console.log(`[TEST2] Token generated: ${Boolean(tokenBody.token)}`);
    console.log(`[TEST2] Token expires: ${tokenBody.expires}`);
    console.log(`[TEST2] Token status: ${tokenBody.status}`);
    console.log('[TEST2] ✓ Authentication token generated successfully');
  });

  // ========== DELETE USER ==========

  /**
   * Test 3: Delete an authenticated user
   * Scope: Verify that DemoQA deletes an existing user by ID.
   * Validations:
   * - The user and authentication token are created successfully
   * - The DELETE endpoint includes the generated user ID
   * - Response status is 204 No Content
   */
  test('test3 - DELETE USER: deletes an existing authenticated account', async ({ request }) => {
    const accountApi = new AccountApi(request);
    console.log(`[TEST3] Creating prerequisite API user: ${credentials.userName}`);

    const createResponse = await accountApi.createUser(credentials);
    expect(createResponse.status()).toBe(201);
    const createdUser = await createResponse.json() as { userID: string };
    createdUserId = createdUser.userID;
    expect(createdUserId).toBeTruthy();

    console.log('[TEST3] Generating the token required to delete the user');
    const tokenResponse = await accountApi.generateToken(credentials);
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json() as { token: string; status: string };
    expect(tokenBody.status).toBe('Success');
    expect(tokenBody.token).toBeTruthy();
    cleanupToken = tokenBody.token;

    // Perform the deletion of the created user using the cleanup token
    const deleteEndpoint = `/Account/v1/User/${createdUserId}`; // Construct the DELETE endpoint URL for the created user
    console.log(`[TEST3] DELETE endpoint: ${deleteEndpoint}`);
    const deleteResponse = await accountApi.deleteUser(createdUserId, cleanupToken);
    console.log(`[TEST3] Delete User response status: ${deleteResponse.status()}`);
    expect(deleteResponse.status()).toBe(204); // Validate that the response status is 204 No Content

    // Prevent teardown from deleting the account already removed by this test.
    createdUserId = undefined;
    cleanupToken = undefined;
    console.log('[TEST3] ✓ User account deleted successfully');
  });

  // ========== GET USER ==========

  /**
   * Test 4: Get an authenticated user
   * Scope: Verify that DemoQA returns the user identified by its generated ID.
   * Validations:
   * - The user and authentication token are created successfully
   * - The GET endpoint includes the generated user ID
   * - Response status is 200 OK
   * - Response contains the expected user ID, username, and empty book collection
   */
  test('test4 - GET USER: returns an existing authenticated account', async ({ request }) => {
    const accountApi = new AccountApi(request);
    console.log(`[TEST4] Creating prerequisite API user: ${credentials.userName}`);

    // Create the user using the AccountApi and validate the response status.
    const createResponse = await accountApi.createUser(credentials);
    expect(createResponse.status()).toBe(201);
    // Extract the created user's ID from the response and validate it.
    const createdUser = await createResponse.json() as { userID: string };
    createdUserId = createdUser.userID;
    expect(createdUserId).toBeTruthy();

    console.log('[TEST4] Generating the token required to get the user');
    const tokenResponse = await accountApi.generateToken(credentials);
    expect(tokenResponse.status()).toBe(200);
    // Extract the authentication token from the response and validate it.
    const tokenBody = await tokenResponse.json() as { token: string; status: string };
    expect(tokenBody.status).toBe('Success');
    expect(tokenBody.token).toBeTruthy();
    cleanupToken = tokenBody.token; // Store the authentication token for subsequent API requests

    // Get the user using the AccountApi and validate the response status.
    const getEndpoint = `/Account/v1/User/${createdUserId}`;
    console.log(`[TEST4] GET endpoint: ${getEndpoint}`);
    // Send a GET request to retrieve the user details using the created user ID and authentication token.
    const getResponse = await accountApi.getUser(createdUserId, cleanupToken);
    console.log(`[TEST4] Get User response status: ${getResponse.status()}`);
    // Validate that the response status is 200 OK before extracting the user details.
    expect(getResponse.status()).toBe(200);

    // Extract the returned user details from the response and validate them.
    const returnedUser = await getResponse.json() as {
      userId: string;
      username: string;
      books: unknown[];
    };

    console.log(`[TEST4] Returned user: ${returnedUser.username}, userID: ${returnedUser.userId}, 
      books: ${JSON.stringify(returnedUser.books)}`);
    expect(returnedUser.userId).toBe(createdUserId); // Validate that the returned user ID matches the created user ID
    expect(returnedUser.username).toBe(credentials.userName); // Validate that the returned username matches the created username
    expect(returnedUser.books).toEqual([]); // Validate that the returned book collection is empty

    console.log('[TEST4] ✓ Authenticated user returned successfully');
  });
});
