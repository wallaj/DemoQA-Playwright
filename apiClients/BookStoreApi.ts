import type { APIRequestContext, APIResponse } from '@playwright/test';

// Playwright request mapping: URL = path; headers = HTTP headers; data = body; params = query parameters.
export class BookStoreApi {
  constructor(private readonly request: APIRequestContext) {}

  async getBooks(): Promise<APIResponse> { // Fetches the public book catalog from the Book Store API
    return this.request.get('/BookStore/v1/Books'); // Sends a GET request to the Book Store API to retrieve the list of books
  }

  // Gets one book from the public catalog by ISBN.
  async getBook(isbn: string): Promise<APIResponse> {
    return this.request.get('/BookStore/v1/Book', {
      params: { ISBN: isbn },
    });
  }

  // Adds books to a user's collection in the Book Store API
  async addBooks(userId: string, isbns: string[], token: string): Promise<APIResponse> {
    
    // Transform the array of ISBNs into the format expected by the Book Store API
    const collectionOfIsbns = isbns.map((currentIsbn) => {
      return { // Creates an object with the current ISBN to match the API's expected format
        isbn: currentIsbn,
      };
    });

    return this.request.post('/BookStore/v1/Books', { // Sends a POST request to add books to the user's collection
      headers: { Authorization: `Bearer ${token}` }, // Sets the Authorization header with the provided token
      data: { // Sets the request body with the user ID and the collection of ISBNs to add
        userId, // The ID of the user to whom the books will be added
        collectionOfIsbns,
      },
    });
  }

  // Deletes every book from an authenticated user's collection.
  async deleteAllBooks(userId: string, token: string): Promise<APIResponse> {
    return this.request.delete('/BookStore/v1/Books', { // Sends a DELETE request to remove all books from the user's collection
      headers: { Authorization: `Bearer ${token}` },
      params: { UserId: userId },
    });
  }

  // Deletes one book from an authenticated user's collection.
  async deleteBook(userId: string, isbn: string, token: string): Promise<APIResponse> {
    return this.request.delete('/BookStore/v1/Book', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        isbn,
        userId,
      },
    });
  }

  // Replaces one book in an authenticated user's collection.
  async replaceBook(userId: string, currentIsbn: string, newIsbn: string, token: string): Promise<APIResponse> {
    return this.request.put(`/BookStore/v1/Books/${currentIsbn}`, { 
      // Sends a PUT request to replace the current book with a new one in the user's collection
      headers: { Authorization: `Bearer ${token}` },
      data: {
        userId,
        isbn: newIsbn,
      },
    });
  }
}
