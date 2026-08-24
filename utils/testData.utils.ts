import { WebTableRecord } from '../pageObjects/WebTablesPage';

/**
 * Generates a deterministic batch of Web Table records for bulk-load testing.
 * Pure data generation — no page/browser dependency, reusable across specs.
 */
export function generateWebTableRecords(count: number, startIndex = 1): WebTableRecord[] {
  const records: WebTableRecord[] = [];

  for (let i = startIndex; i < startIndex + count; i++) {
    records.push({
      firstName: `Bulk${i}`,
      lastName: `Tester${i}`,
      email: `bulk.tester${i}@example.com`,
      age: String(20 + (i % 40)), // Age cycles between 20 and 59. (i % 40) is the offset from 20
      salary: String(30000 + i * 100), // Salary increments by 100 for each record
      department: 'BulkLoad',
    });
  }

  return records;
}
