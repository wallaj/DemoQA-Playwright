import { randomUUID } from 'node:crypto';
import type { DemoQACredentials } from './auth.utils';

// Generates unique credentials for testing purposes.
// Returns an object containing a unique username and password.
export function generateUniqueCredentials(): DemoQACredentials {
  // Generate a unique username and password using a random UUID. randomUUID() generates a unique identifier, 
  // which is then formatted to create a username and password that are unlikely to collide with existing users.   
  const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12); // Generate a 12-character unique ID without hyphens

  return {
    userName: `api_${uniqueId}`, // Generate a unique username prefixed with 'api_'
    password: `DemoQA@${uniqueId}Aa1`, // Generate a unique password that meets common complexity requirements
  };
}
