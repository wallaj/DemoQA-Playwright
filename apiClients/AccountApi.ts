import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { DemoQACredentials } from '../utils/auth.utils';

// AccountApi class provides methods to interact with the DemoQA Account API endpoints.
export class AccountApi {
  // Initializes the AccountApi with the provided APIRequestContext.  
  constructor(private readonly request: APIRequestContext) {}

  // Creates a new user with the provided credentials.
  // Returns a promise that resolves to the API response.
  // Sends a POST request to the /Account/v1/User endpoint with the provided credentials.
  async createUser(credentials: DemoQACredentials): Promise<APIResponse> {
    return this.request.post('/Account/v1/User', {
      data: credentials,
    });
  }

  // Generates an authentication token for the provided credentials.
  // Returns a promise that resolves to the API response.
  // Sends a POST request to the /Account/v1/GenerateToken endpoint with the provided credentials.
  async generateToken(credentials: DemoQACredentials): Promise<APIResponse> {
    return this.request.post('/Account/v1/GenerateToken', {
      data: credentials,
    });
  }

  // Gets an authenticated user by ID.
  // Returns a promise that resolves to the API response.
  async getUser(userId: string, token: string): Promise<APIResponse> {
    // Sends a GET request to the /Account/v1/User/{userId} endpoint with the provided authentication token.
    return this.request.get(`/Account/v1/User/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Deletes the user with the specified ID using the provided authentication token.
  // Returns a promise that resolves to the API response.
  // Sends a DELETE request to the /Account/v1/User/{userId} endpoint with the provided authentication token.
  async deleteUser(userId: string, token: string): Promise<APIResponse> {
    return this.request.delete(`/Account/v1/User/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
