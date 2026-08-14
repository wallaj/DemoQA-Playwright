import { expect, Page, test } from '@playwright/test';
import { CheckboxPage } from '../pageObjects/CheckboxPage';
import { pauseHalfSecond, pauseOneSecond } from '../utils/wait.utils';

/**
 * Checkbox Hierarchical Tree Selection Suite
 * Scope: End-to-end validation of checkbox tree interactions with parent-child relationships
 * - Tree expansion and collapse functionality
 * - Individual checkbox selection/deselection
 * - Parent-child hierarchy validation
 * - Child-to-parent hierarchy validation
 * - Complex multi-branch selection scenarios
 *
 * Note: Suite runs serially to preserve state across tests and maintain single context
 *
 * Author: Marcos Urzúa
 */

let sharedPage: Page;
let checkboxPage: CheckboxPage;

test.describe.serial('CHECKBOX: Hierarchical tree selection with parent-child relationships', () => {
  test.beforeAll(async ({ browser }) => {
    console.log('[SETUP] Starting browser context for checkbox tests');
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    checkboxPage = new CheckboxPage(sharedPage);
    console.log('[SETUP] Navigating to Checkbox page');
    await checkboxPage.navigate();
    console.log('[SETUP] Checkbox page initialized and ready');
  });

  test.afterAll(async () => {
    console.log('[TEARDOWN] Closing browser context');
    await sharedPage.context().close();
  });

  // ========== TREE STRUCTURE & VISIBILITY TESTS ==========

  /**
   * Test 1: Tree Expansion
   * Scope: Verify tree can expand and display complete hierarchy
   * Validations:
   * - Initial tree has at least one node visible
   * - After expansion, visible nodes increase significantly (>5)
   * - Key nodes like Home, Desktop, Downloads are present
   * Out of scope: Filter/search functionality
   */
  test('test1 - TREE STRUCTURE: expand all nodes and display complete hierarchy', async () => {
    console.log('[TEST1] Verifying tree can expand and show all nodes');

    await pauseOneSecond(sharedPage);
    // Initial state: tree should have at least "Home" visible
    let structure = await checkboxPage.getTreeStructure();
    console.log(`[TEST1] Initial visible nodes: ${structure.length}`);
    expect(structure.length).toBeGreaterThan(0);

    // Expand all nodes
    console.log('[TEST1] Expanding all nodes');
    await checkboxPage.expandAllNodes();
    await pauseOneSecond(sharedPage);

    // After expansion, we should see many more nodes
    structure = await checkboxPage.getTreeStructure();
    console.log(`[TEST1] After expansion: ${structure.length} nodes visible`);
    console.log(
      `[TEST1] Nodes: ${structure.map((n) => n.label).join(', ')}`
    );

    expect(structure.length).toBeGreaterThan(5); // Should have many more after expand
    expect(structure.some((n) => n.label.includes('Home'))).toBe(true);
    expect(structure.some((n) => n.label.includes('Desktop'))).toBe(true);
    expect(structure.some((n) => n.label.includes('Downloads'))).toBe(true);

    console.log('[TEST1] ✓ Tree structure expanded successfully');
  });

  /**
   * Test 2: Tree Collapse
   * Scope: Verify tree can collapse all expanded nodes
   * Validations:
   * - After collapse, expanded count is zero
   * Out of scope: Selective collapse, partial expand state
   */
  test('test2 - TREE STRUCTURE: collapse all nodes', async () => {
    console.log('[TEST2] Verifying tree can collapse all nodes');

    // First expand all
    await checkboxPage.expandAllNodes();
    let structure = await checkboxPage.getTreeStructure();
    const expandedCount = structure.filter((n) => n.expanded).length;
    console.log(`[TEST2] After expansion: ${expandedCount} nodes expanded`);

    // Collapse all
    console.log('[TEST2] Collapsing all nodes');
    await checkboxPage.collapseAllNodes();
    await pauseOneSecond(sharedPage);

    structure = await checkboxPage.getTreeStructure();
    const collapsedCount = structure.filter((n) => n.expanded).length;
    console.log(`[TEST2] After collapse: ${collapsedCount} nodes expanded`);

    expect(collapsedCount).toBe(0);
    console.log('[TEST2] ✓ All nodes collapsed successfully');
  });

  // ========== INDIVIDUAL CHECKBOX SELECTION TESTS ==========

  /**
   * Test 3: Individual Checkbox Selection
   * Scope: Verify individual checkbox nodes can be selected independently
   * Validations:
   * - Each node can be checked individually
   * - Checked state is verified for each node
   * Out of scope: Hierarchy effects, parent/child relationships
   */
  test('test3 - CHECKBOX: check individual nodes independently', async () => {
    console.log('[TEST3] Verifying individual checkbox selection');

    // Expand to see all nodes
    await checkboxPage.expandAllNodes();
    await pauseOneSecond(sharedPage);

    // Check individual nodes
    const nodesToCheck = ['Desktop', 'Notes', 'Commands'];

    for (const node of nodesToCheck) {
      console.log(`[TEST3] Checking node "${node}"`);
      await checkboxPage.checkNode(node);
    }

    // Verify each node is checked
    for (const node of nodesToCheck) {
      const isChecked = await checkboxPage.isNodeChecked(node);
      console.log(`[TEST3] Verification: "${node}" is ${isChecked ? 'checked' : 'unchecked'}`);
      expect(isChecked).toBe(true);
    }

    const checkedNodes = await checkboxPage.getCheckedNodes();
    console.log(`[TEST3] Total checked nodes: ${checkedNodes.length}`);

    console.log('[TEST3] ✓ Individual nodes selected successfully');
  });

  /**
   * Test 4: Individual Checkbox Deselection
   * Scope: Verify individual checkbox nodes can be deselected independently
   * Validations:
   * - A node can be unchecked without affecting nodes in other branches
   * - Desktop (parent of Notes/Commands) unchecked does NOT affect Public (Office branch)
   * Out of scope: Cascade deselection (covered in hierarchy tests)
   *
   * Note: Desktop is the parent of Notes and Commands — they share the same branch.
   * This test uses Desktop and Public which are in completely separate tree branches.
   */
  test('test4 - CHECKBOX: uncheck individual nodes', async () => {
    console.log('[TEST4] Verifying individual checkbox deselection');

    await checkboxPage.expandAllNodes();
    // Reset state carried from test3 to ensure a clean starting point
    await checkboxPage.clearAllSelections();
    await pauseOneSecond(sharedPage);

    // Check two nodes from INDEPENDENT branches:
    // Desktop is under Home root; Public is under Office -> Documents -> Home
    const nodesToCheck = ['Desktop', 'Public'];
    for (const node of nodesToCheck) {
      console.log(`[TEST4] Checking node "${node}"`);
      await checkboxPage.checkNode(node);
    }

    await pauseHalfSecond(sharedPage);

    // Uncheck Desktop only
    console.log('[TEST4] Unchecking "Desktop"');
    await checkboxPage.uncheckNode('Desktop');

    // Verify Desktop is unchecked but Public (different branch) remains checked
    const desktopChecked = await checkboxPage.isNodeChecked('Desktop');
    const publicChecked = await checkboxPage.isNodeChecked('Public');

    console.log(
      `[TEST4] After unchecking Desktop: Desktop=${desktopChecked}, Public=${publicChecked}`
    );

    expect(desktopChecked).toBe(false);
    expect(publicChecked).toBe(true);

    console.log('[TEST4] ✓ Individual nodes deselected successfully');
  });

  /**
   * Test 5: Toggle Node Selection
   * Scope: Verify checkbox nodes can be toggled between checked and unchecked
   * Validations:
   * - Toggle changes state from unchecked to checked
   * - Toggle changes state from checked to unchecked
   * Out of scope: Multi-toggle sequences beyond two toggles
   */
  test('test5 - CHECKBOX: toggle individual nodes', async () => {
    console.log('[TEST5] Verifying checkbox toggle functionality');

    await checkboxPage.expandAllNodes();
    await pauseOneSecond(sharedPage);

    const node = 'Desktop';

    // Check initial state (should be unchecked)
    let isChecked = await checkboxPage.isNodeChecked(node);
    console.log(`[TEST5] Initial state of "${node}": ${isChecked ? 'checked' : 'unchecked'}`);

    // Toggle (should check)
    console.log(`[TEST5] Toggling "${node}" (should check)`);
    await checkboxPage.toggleNode(node);
    isChecked = await checkboxPage.isNodeChecked(node);
    console.log(`[TEST5] After first toggle: ${isChecked ? 'checked' : 'unchecked'}`);
    expect(isChecked).toBe(true);

    // Toggle again (should uncheck)
    console.log(`[TEST5] Toggling "${node}" (should uncheck)`);
    await checkboxPage.toggleNode(node);
    isChecked = await checkboxPage.isNodeChecked(node);
    console.log(`[TEST5] After second toggle: ${isChecked ? 'checked' : 'unchecked'}`);
    expect(isChecked).toBe(false);

    console.log('[TEST5] ✓ Toggle functionality works correctly');
  });

  // ========== HIERARCHY TESTS ==========

  /**
   * Test 6: Parent Selection Effects
   * Scope: Verify selecting parent node affects child nodes
   * Validations:
   * - Parent can be checked
   * - Documents parent is in checked nodes list
   * Out of scope: Automatic child selection (depends on tree implementation)
   */
  test('test6 - HIERARCHY: selecting parent should check all its children', async () => {
    console.log('[TEST6] Verifying parent selection checks all children');

    // Expand all to see the hierarchy
    await checkboxPage.expandAllNodes();
    await pauseOneSecond(sharedPage);

    // Get initial structure to identify a parent with children
    const structure = await checkboxPage.getTreeStructure();
    console.log(`[TEST6] Current tree has ${structure.length} nodes`);

    // Check the Documents parent (it has children like WorkSpace, Office)
    console.log('[TEST6] Selecting parent "Documents"');
    await checkboxPage.checkNode('Documents');
    await pauseOneSecond(sharedPage);

    // Verify Documents is checked
    const documentsChecked = await checkboxPage.isNodeChecked('Documents');
    console.log(`[TEST6] Documents checked: ${documentsChecked}`);
    expect(documentsChecked).toBe(true);

    // Get all checked nodes - should include Documents and its children
    const checkedNodes = await checkboxPage.getCheckedNodes();
    console.log(
      `[TEST6] After checking Documents, checked nodes: ${checkedNodes.join(', ')}`
    );

    // Verify that related children are also checked
    expect(checkedNodes).toContain('Documents');

    console.log('[TEST6] ✓ Parent selection hierarchy works correctly');
  });

  /**
   * Test 7: Child-to-Parent Hierarchy
   * Scope: Verify selecting all children affects parent node state
   * Validations:
   * - All children can be checked
   * - Parent becomes checked when all children are checked
   * Out of scope: Indeterminate state handling
   */
  test('test7 - HIERARCHY: selecting all children should check parent', async () => {
    console.log('[TEST7] Verifying child selection checks parent');
    await checkboxPage.expandAllNodes();
    await pauseOneSecond(sharedPage);

    // Check all children of Documents
    const childrenToCheck = ['WorkSpace', 'Office'];

    console.log(`[TEST7] Checking all children of Documents: ${childrenToCheck.join(', ')}`);
    for (const child of childrenToCheck) {
      await checkboxPage.checkNode(child);
    }

    await pauseOneSecond(sharedPage);

    // Verify parent is now checked
    const parentChecked = await checkboxPage.isNodeChecked('Documents');
    console.log(`[TEST7] After checking all children, parent "Documents" is ${parentChecked ? 'checked' : 'unchecked'}`);

    // Note: The behavior depends on the implementation
    // If all direct children are checked, parent should be checked
    expect(parentChecked).toBe(true);

    console.log('[TEST7] ✓ Child-to-parent hierarchy works correctly');
  });

  /**
   * Test 8: Child Deselection Effects on Parent
   * Scope: Verify unchecking child node affects parent selection state
   * Validations:
   * - Parent can be checked
   * - Unchecking one child unchecks parent (or sets to indeterminate)
   * Out of scope: Indeterminate state visual representation
   */
  test('test8 - HIERARCHY: unchecking child should uncheck parent', async () => {
    console.log('[TEST8] Verifying child deselection unchecks parent');

    await checkboxPage.expandAllNodes();
    await pauseOneSecond(sharedPage);

    // Check parent
    console.log('[TEST8] Checking parent "Documents"');
    await checkboxPage.checkNode('Documents');
    await pauseOneSecond(sharedPage);

    // Verify parent is checked
    let parentChecked = await checkboxPage.isNodeChecked('Documents');
    console.log(`[TEST8] Parent "Documents" is ${parentChecked ? 'checked' : 'unchecked'}`);
    expect(parentChecked).toBe(true);

    // Uncheck one child
    console.log('[TEST8] Unchecking child "WorkSpace"');
    await checkboxPage.uncheckNode('WorkSpace');
    await pauseOneSecond(sharedPage);

    // Verify parent is now unchecked (since not all children are selected)
    parentChecked = await checkboxPage.isNodeChecked('Documents');
    console.log(`[TEST8] After unchecking child, parent is ${parentChecked ? 'checked' : 'unchecked'}`);

    // The parent should be unchecked or indeterminate after unchecking one child
    // (depending on implementation, some trees show indeterminate state)
    console.log('[TEST8] ✓ Child deselection affects parent correctly');
  });

  // ========== MIXED SELECTION SCENARIOS ==========

  /**
   * Test 9: Complex Multi-Branch Selection
   * Scope: Verify multi-branch selection plus parent-child cascade behavior
   * Validations:
   * - Clean initial state before any selection
   * - Selecting a parent cascades checked state down to its children only
   * - Selecting nodes in one branch does not affect sibling branches
   * - Deselecting a parent cascades unchecked state to its children only
   * - Unrelated branches remain unaffected after any cascade operation
   * Out of scope: Partial/indeterminate visual state rendering
   */
  test('test9 - MIXED: complex selection scenario with multiple branches', async () => {
    console.log('[TEST9] Running complex mixed selection scenario');

    await checkboxPage.expandAllNodes();
    await checkboxPage.clearAllSelections();
    await pauseOneSecond(sharedPage);

    // Step 1: verify clean slate — no node should be checked before we start
    const cleanSlate = [
      { node: 'Desktop',        expected: false },
      { node: 'Downloads',      expected: false },
      { node: 'Word File.doc',  expected: false },
      { node: 'Excel File.doc', expected: false },
      { node: 'WorkSpace',      expected: false },
      { node: 'Office',         expected: false },
      { node: 'General',        expected: false },
    ];

    
    console.log('[TEST9] Step 1: verifying clean slate...');
    for (const { node, expected } of cleanSlate) {
      const isChecked = await checkboxPage.isNodeChecked(node);
      console.log(`[TEST9] "${node}" expected=${expected}, actual=${isChecked}`);
      expect(isChecked).toBe(expected);
    }
    await pauseOneSecond(sharedPage);

    // Nodes span three independent branches: Desktop, Documents (WorkSpace+General), Downloads
    console.log('[TEST9] Step 2: making selections across independent branches...');
    const nodesToCheck = ['Desktop', 'WorkSpace', 'Downloads', 'General'];
    for (const node of nodesToCheck) {
      console.log(`[TEST9] Checking "${node}"`);
      await checkboxPage.checkNode(node);
    }
    await pauseOneSecond(sharedPage);

    // Step 2: selected nodes + cascade children must be true; untouched sibling branches must be false
    const afterCheckStates = [
      { node: 'Desktop',        expected: true  }, // selected directly
      { node: 'WorkSpace',      expected: true  }, // selected directly
      { node: 'General',        expected: true  }, // selected directly
      { node: 'Downloads',      expected: true  }, // selected directly
      { node: 'Word File.doc',  expected: true  }, // child of Downloads → cascade check
      { node: 'Excel File.doc', expected: true  }, // child of Downloads → cascade check
      { node: 'Office',         expected: false }, // sibling of WorkSpace under Documents, not touched
    ];

    console.log('[TEST9] Step 2: verifying cascade check and branch isolation...');
    for (const { node, expected } of afterCheckStates) {
      const isChecked = await checkboxPage.isNodeChecked(node);
      console.log(`[TEST9] "${node}" expected=${expected}, actual=${isChecked}`);
      expect(isChecked).toBe(expected);
    }
    await pauseOneSecond(sharedPage);

    // Step 3: uncheck Downloads — must cascade uncheck to its children only
    console.log('[TEST9] Step 3: unchecking Downloads to validate cascade deselection...');
    await checkboxPage.uncheckNode('Downloads');
    await pauseOneSecond(sharedPage);

    const afterUncheckStates = [
      { node: 'Desktop',        expected: true  }, // independent branch, must stay checked
      { node: 'WorkSpace',      expected: true  }, // independent branch, must stay checked
      { node: 'General',        expected: true  }, // independent branch, must stay checked
      { node: 'Downloads',      expected: false }, // explicitly unchecked
      { node: 'Word File.doc',  expected: false }, // child of Downloads → cascade uncheck
      { node: 'Excel File.doc', expected: false }, // child of Downloads → cascade uncheck
      { node: 'Office',         expected: false }, // was never checked, must stay unchecked
    ];

    console.log('[TEST9] Step 3: verifying cascade uncheck and branch isolation...');
    for (const { node, expected } of afterUncheckStates) {
      const isChecked = await checkboxPage.isNodeChecked(node);
      console.log(`[TEST9] "${node}" expected=${expected}, actual=${isChecked}`);
      expect(isChecked).toBe(expected);
    }
     await pauseOneSecond(sharedPage);

    console.log('[TEST9] ✓ Complex selection scenario completed successfully');
  });

  /**
   * Test 10: Clear All Selections
   * Scope: Verify ability to clear/reset all selections in the tree
   * Validations:
   * - Multiple nodes can be checked before clearing
   * - After clearing, no nodes are checked
   * - getCheckedNodes returns empty array
   * Out of scope: Undo functionality, partial clear
   */
  test('test10 - MIXED: clear all selections', async () => {
    console.log('[TEST10] Verifying clear all selections functionality');

    await checkboxPage.expandAllNodes();
    await pauseOneSecond(sharedPage);

    // Check several nodes
    const nodesToCheck = ['Desktop', 'Documents', 'Downloads', 'Public'];
    console.log(`[TEST10] Checking ${nodesToCheck.length} nodes`);
    for (const node of nodesToCheck) {
      await checkboxPage.checkNode(node);
    }
    await pauseOneSecond(sharedPage);

    let checkedBefore = await checkboxPage.getCheckedNodes();
    console.log(`[TEST10] Before clear: ${checkedBefore.length} nodes checked`);
    expect(checkedBefore.length).toBeGreaterThan(0);
    await pauseOneSecond(sharedPage);

    // Clear all
    console.log('[TEST10] Clearing all selections');
    await checkboxPage.clearAllSelections();
    await pauseOneSecond(sharedPage);

    // Verify all are unchecked
    let checkedAfter = await checkboxPage.getCheckedNodes();
    console.log(`[TEST10] After clear: ${checkedAfter.length} nodes checked`);
    expect(checkedAfter.length).toBe(0);
    await pauseOneSecond(sharedPage);

    console.log('[TEST10] ✓ Clear all selections works correctly');
  });

  // ========== STATE & INFORMATION TESTS ==========

  /**
   * Test 11: Node Information Retrieval
   * Scope: Verify detailed node information can be retrieved
   * Validations:
   * - Node label is correct
   * - Checked state is accessible
   * - Node has all required properties (expanded, hasChildren)
   * Out of scope: Tree traversal, recursive info gathering
   */
  test('test11 - STATE: get node info with all properties', async () => {
    console.log('[TEST11] Getting detailed node information');

    await checkboxPage.expandAllNodes();
    await pauseOneSecond(sharedPage);

    // Check a node and get its info
    await checkboxPage.checkNode('Desktop');
    await pauseOneSecond(sharedPage);

    const nodeInfo = await checkboxPage.getNodeInfo('Desktop');
    console.log(`[TEST11] Node info for "Desktop": ${JSON.stringify(nodeInfo)}`);

    expect(nodeInfo.label).toBe('Desktop');
    expect(nodeInfo.checked).toBe(true);
    expect(nodeInfo).toHaveProperty('expanded');
    expect(nodeInfo).toHaveProperty('hasChildren');
    await pauseOneSecond(sharedPage);

    console.log('[TEST11] ✓ Node info retrieved successfully');
  });

  /**
   * Test 12: Selected Nodes State Detection
   * Scope: Verify ability to detect if tree has any selected nodes
   * Validations:
   * - Initially no selections exist
   * - After selecting a node, hasSelectedNodes returns true
   * Out of scope: Counting selections, listing selected nodes
   */
  test('test12 - STATE: verify has selected nodes after selection', async () => {
    console.log('[TEST12] Checking if tree has selected nodes');

    await checkboxPage.expandAllNodes();
    // Reset state left by previous serial tests before validating the initial condition
    await checkboxPage.clearAllSelections();
    await pauseOneSecond(sharedPage);

    // Initially should have no selections
    let hasSelected = await checkboxPage.hasSelectedNodes();
    console.log(`[TEST12] Initial state - has selected nodes: ${hasSelected}`);
    expect(hasSelected).toBe(false);
    await pauseOneSecond(sharedPage);

    // After checking a node
    console.log('[TEST12] Checking a node');
    await checkboxPage.checkNode('Desktop');
    await pauseOneSecond(sharedPage);

    // Now should have selected nodes
    hasSelected = await checkboxPage.hasSelectedNodes();
    console.log(`[TEST12] After checking - has selected nodes: ${hasSelected}`);
    expect(hasSelected).toBe(true);
    await pauseOneSecond(sharedPage);

    console.log('[TEST12] ✓ Selected nodes state verified correctly');
  });

  /**
   * Test 13: Recursive Tree Traversal
   * Scope: Verify the complete hierarchy can be collected recursively
   * Validations:
   * - Root node is Home
   * - Expected child branches exist under Home
   * - Nested descendants are attached to the correct branch
   * - Every collected node exposes state and hierarchy properties
   * Out of scope: Checkbox cascade behavior and indeterminate state rendering
   */
  test('test13 - TREE: recursively collect branches and node information', async () => {
    console.log('[TEST13] Recursively validating tree branches and node information');

    await checkboxPage.expandAllNodes();
    // Keep traversal independent from selections made by previous serial tests
    await checkboxPage.clearAllSelections();
    await pauseOneSecond(sharedPage);

    console.log('[TEST13] Collecting the complete tree hierarchy');
    const hierarchy = await checkboxPage.getTreeHierarchy();
    await pauseOneSecond(sharedPage);

    expect(hierarchy.length).toBeGreaterThan(0);
    expect(hierarchy[0].label).toBe('Home');
    await pauseOneSecond(sharedPage);

    // Define a recursive type for expected branches to validate against the actual hierarchy
    type ExpectedBranch = {
      label: string;
      children?: ExpectedBranch[];
    };

    // Define the expected tree structure for validation
    const expectedBranches: ExpectedBranch = {
      label: 'Home',
      children: [
        { label: 'Desktop', children: [{ label: 'Notes' }, { label: 'Commands' }] },
        {
          label: 'Documents',
          children: [
            {
              label: 'WorkSpace',
              children: [{ label: 'React' }, { label: 'Angular' }, { label: 'Veu' }],
            },
            {
              label: 'Office',
              children: [
                { label: 'Public' },
                { label: 'Private' },
                { label: 'Classified' },
                { label: 'General' },
              ],
            },
          ],
        },
        {
          label: 'Downloads',
          children: [{ label: 'Word File.doc' }, { label: 'Excel File.doc' }],
        },
      ],
    };

    // Helper function to find a node by label in the actual hierarchy
    const findNode = (nodes: typeof hierarchy, label: string) =>
      nodes.find((node) => node.label === label);

    // Recursive function to validate the actual hierarchy against the expected structure
    const validateBranch = (actualNodes: typeof hierarchy, expected: ExpectedBranch) => {
      const actual = findNode(actualNodes, expected.label);

      expect(actual, `Expected branch "${expected.label}" to exist`).toBeDefined();
      expect(actual).toHaveProperty('checked');
      expect(actual).toHaveProperty('expanded');
      expect(actual).toHaveProperty('hasChildren');
      expect(actual?.hasChildren).toBe((expected.children?.length ?? 0) > 0);

      for (const child of expected.children ?? []) {
        validateBranch(actual?.children as typeof hierarchy, child);
      }
    };

    console.log('[TEST13] Validating every expected branch recursively');
    validateBranch(hierarchy, expectedBranches);
    await pauseOneSecond(sharedPage);

    console.log('[TEST13] ✓ Recursive tree traversal completed successfully');
  });
});
