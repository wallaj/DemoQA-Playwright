import type { Reporter, FullConfig, Suite, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

type ReportPaths = {
  reportFolder: string;
  junitFile: string;
};

/**
 * Renames the fixed temp report/junit output to index-all / index-selection /
 * index-<tag>, based on which tests actually ran. Playwright's suite here
 * reflects the real execution plan regardless of how it was triggered (CLI
 * grep, file:line args, or VS Code's persistent test server, which doesn't
 * expose selection via argv).
 */
export default class ReportSubfolderReporter implements Reporter {
  private specName = 'unknown';
  private subfolder = 'index-all';
  private tempReportDir = '';
  private tempJunitFile = '';

  constructor(paths: ReportPaths) {
    this.tempReportDir = path.resolve(paths.reportFolder);
    this.tempJunitFile = path.resolve(paths.junitFile);
  }

  onBegin(_config: FullConfig, suite: Suite) {
    const tests = suite.allTests();
    if (tests.length === 0) return; // nothing ran, keep default folder names

    // Spec name is derived from the first running test's file, not env vars,
    // so it stays correct even when triggered outside our npm scripts.
    const specFile = tests[0].location.file;
    this.specName = path.basename(specFile).replace(/\.spec\.(ts|js)$/, '').toLowerCase();

    // Total test() calls in the file = the "everything" baseline to compare against.
    const totalInFile = (fs.readFileSync(specFile, 'utf-8').match(/\btest\(\s*['"`]/g) ?? []).length; // count test() calls in the file
    const runningCount = tests.length;

    // Decide which subfolder to use based on how many tests ran. If all tests in the file ran, it's "index-all". 
    // If only one test ran, it's "index-testN" (or "index-individual" if the test isn't tagged that way). 
    // Otherwise, it's "index-selection".
    if (runningCount >= totalInFile) {
      this.subfolder = 'index-all';
    } else if (runningCount === 1) {
      // Prefer the test's own "testN" tag; fall back to a generic name if untitled that way.
      const tagMatch = tests[0].title.match(/test(\d+)/i);
      this.subfolder = tagMatch ? `index-test${tagMatch[1]}` : 'index-individual';
    } else {
      this.subfolder = 'index-selection';
    }
  }

  // onEnd is called after all tests have finished, so we can safely rename the temp output folder to the final destination.
  onEnd(_result: FullResult) {
    // html reporter + outputDir share the same temp folder, so this single
    // rename keeps every internal relative link (report <-> screenshots) intact.
    this.moveDir(this.tempReportDir, `test-results/${this.specName}/${this.subfolder}`);
    this.moveJunit(
      this.tempJunitFile,
      `junit-results/${this.specName}-${this.subfolder}-results.xml`
    );
  }
  
  // Moves a directory from one location to another, creating the destination path if necessary. If the source doesn't exist, it does nothing. If the destination exists, it is removed first.
  private moveDir(from: string, to: string) {
    if (!fs.existsSync(from)) return;
    fs.rmSync(to, { recursive: true, force: true }); // only same-mode runs should ever collide here
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
  }

  // Moves a JUnit XML file from one location to another, creating the destination path if necessary. If the source doesn't exist, it does nothing. If the destination exists, it is removed first. After moving, it also updates the content of the XML file to replace any references to the temp folder name with the final subfolder name.
  private moveJunit(from: string, to: string) {
    if (!fs.existsSync(from)) return;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.rmSync(to, { force: true });
    fs.renameSync(from, to);

    // JUnit bakes the temp folder name into attachment path text; fix it post-move.
    const content = fs.readFileSync(to, 'utf-8').split('.pw-tmp').join(this.subfolder);
    fs.writeFileSync(to, content, 'utf-8');
  }
}
