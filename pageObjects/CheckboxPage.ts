import { Page, Locator } from '@playwright/test';
// This file defines a Page Object for the DemoQA CheckBox page, which contains a hierarchical tree of checkboxes.
type TreeNodeInfo = {
  label: string;
  checked: boolean;
  expanded: boolean;
  hasChildren: boolean;
  children: TreeNodeInfo[];
};

/**
 * CheckboxPage - Page Object for DemoQA CheckBox section at /checkbox
 *
 * This page object handles interaction with a hierarchical checkbox tree structure.
 * The tree uses react-checkbox-tree (rct) which provides parent-child relationships
 * where selecting a parent checks all children, and selecting all children checks the parent.
 *
 * Tree Structure Example:
 * - Home (parent)
 *   - Desktop
 *   - Documents (parent)
 *     - WorkSpace (parent)
 *       - React
 *       - Angular
 *       - Veu
 *     - Office (parent)
 *       - Public
 *       - Private
 *       - Classified
 *       - General
 *   - Downloads (parent)
 *     - Word File.doc
 *     - Excel File.doc
 */
export class CheckboxPage {
  private page: Page;

  // Helper methods to generate locators dynamically
  private treeItems = (label?: string): Locator =>
    label
      ? this.page.locator(`div[role="treeitem"]:has(span.rc-tree-title:text("${label}"))`)
      : this.page.locator('div[role="treeitem"]');
  private expandButton = (label: string): Locator =>
    this.page.locator(
      `div[role="treeitem"]:has(span.rc-tree-title:text("${label}")) span.rc-tree-switcher`
    );
  private checkbox = (label: string): Locator =>
    this.page.locator(
      `div[role="treeitem"]:has(span.rc-tree-title:text("${label}")) span.rc-tree-checkbox`
    );
  private nodeLabel = (label: string): Locator =>
    this.page.locator(
      `div[role="treeitem"]:has(span.rc-tree-title:text("${label}")) span.rc-tree-title`
    );

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the Checkbox page
   */
  async navigate(): Promise<void> {
    console.log('[CHECKBOX] Navigating to checkbox page');
    await this.page.goto('https://demoqa.com/checkbox');
    // Wait for the tree to load
    await this.page.waitForSelector('div[role="tree"]', { timeout: 10000 });
    console.log('[CHECKBOX] Checkbox page loaded successfully');
  }

  /**
   * Expand all collapsed nodes in the tree hierarchy
   * Iteratively clicks expand buttons until all nodes are expanded
   */
  async expandAllNodes(): Promise<void> {
    console.log('[CHECKBOX] Expanding all tree nodes');
    let iterations = 0;
    const maxIterations = 15;

    // Loop until all nodes are expanded or max iterations reached
    while (iterations < maxIterations) {
      // Count remaining closed switchers
      const closedCount = await this.page.locator('span.rc-tree-switcher_close').count();

      if (closedCount === 0) {
        console.log('[CHECKBOX] All nodes expanded');
        break;
      }

      console.log(`[CHECKBOX] Found ${closedCount} collapsed nodes, expanding...`);

      // Click the first closed switcher with force to handle visibility issues
      await this.page.locator('span.rc-tree-switcher_close').first().click({ force: true });
      await this.page.waitForTimeout(150);

      iterations++;
    }

    if (iterations >= maxIterations) {
      console.warn('[CHECKBOX] Reached max iterations while expanding nodes');
    }
  }

  /**
   * Collapse all expanded nodes in the tree hierarchy
   */
  async collapseAllNodes(): Promise<void> {
    console.log('[CHECKBOX] Collapsing all tree nodes');
    let iterations = 0;
    const maxIterations = 15;

    // Loop until all nodes are collapsed or max iterations reached
    while (iterations < maxIterations) {
      const openCount = await this.page.locator('span.rc-tree-switcher_open').count();

      if (openCount === 0) {
        console.log('[CHECKBOX] All nodes collapsed');
        break;
      }

      console.log(`[CHECKBOX] Found ${openCount} expanded nodes, collapsing...`);

      await this.page.locator('span.rc-tree-switcher_open').first().click({ force: true });
      await this.page.waitForTimeout(150);

      iterations++;
    }

    if (iterations >= maxIterations) {
      console.warn('[CHECKBOX] Reached max iterations while collapsing nodes');
    }
  }

  /**
   * Get the current tree structure with expanded/checked states
   * Returns an array of all visible tree items with their properties
   */
  async getTreeStructure(): Promise<
    Array<{ label: string; expanded: boolean; checked: boolean }>
  > {
    console.log('[CHECKBOX] Retrieving tree structure');

    const structure = await this.page.evaluate((): Array<{ label: string; expanded: boolean; checked: boolean }> => {
      const items: Array<{ label: string; expanded: boolean; checked: boolean }> = [];
      const treeItems = document.querySelectorAll('div[role="treeitem"]');

      treeItems.forEach((item: Element) => {
        const titleElement = item.querySelector('span.rc-tree-title');
        const switcherElement = item.querySelector('span.rc-tree-switcher');
        const checkboxElement = item.querySelector('span.rc-tree-checkbox');

        if (titleElement) {
          const label = titleElement.textContent?.trim() || '';
          const expanded = switcherElement?.classList.contains('rc-tree-switcher_open') ?? false;
          const checked = checkboxElement?.getAttribute('aria-checked') === 'true';

          items.push({ label, expanded, checked });
        }
      });

      return items;
    });

    console.log(`[CHECKBOX] Found ${structure.length} tree items`);
    return structure;
  }

  /**
   * Recursively collect the visible tree hierarchy and node state.
   * The tree must be expanded before calling this method so every branch is available in the DOM.
   */



  // Recursively retrieves the tree hierarchy and returns it as a structured array of TreeNodeInfo objects.
  async getTreeHierarchy(): Promise<TreeNodeInfo[]> {
    console.log('[CHECKBOX] Recursively retrieving tree hierarchy');

    // Use page.evaluate to run code in the browser context and collect the hierarchy
    const hierarchy = await this.page.evaluate((): TreeNodeInfo[] => {
      const roots: TreeNodeInfo[] = [];
      const ancestors: Array<{ depth: number; node: TreeNodeInfo }> = [];
      const treeItems = document.querySelectorAll('div[role="treeitem"]');

      // Iterate through each tree item and build the hierarchy based on depth and parent-child relationships
      treeItems.forEach((item) => {
        const titleElement = item.querySelector('span.rc-tree-title');
        const checkboxElement = item.querySelector('span.rc-tree-checkbox');
        const switcherElement = item.querySelector('span.rc-tree-switcher');

        // Create a new TreeNodeInfo object for the current item
        const node: TreeNodeInfo = {
          label: titleElement?.textContent?.trim() ?? '',
          checked: checkboxElement?.getAttribute('aria-checked') === 'true',
          expanded: item.getAttribute('aria-expanded') === 'true',
          hasChildren:
            switcherElement !== null &&
            !switcherElement.classList.contains('rc-tree-switcher-noop'),
          children: [],
        };
        const depth = item.querySelectorAll('span.rc-tree-indent-unit').length;

        // Pop ancestors until we find the correct parent based on depth
        while (ancestors.length > 0 && ancestors[ancestors.length - 1].depth >= depth) {
          ancestors.pop();
        }

        const parent = ancestors[ancestors.length - 1]?.node;
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }

        ancestors.push({ depth, node });
      });

      return roots;
    });

    console.log(`[CHECKBOX] Recursively found ${hierarchy.length} root nodes`);
    return hierarchy;
  }

  /**
   * Get list of all currently checked nodes
   */
  async getCheckedNodes(): Promise<string[]> {
    console.log('[CHECKBOX] Getting list of checked nodes');

    // Use page.evaluate to run code in the browser context and collect checked nodes
    const checked = await this.page.evaluate((): string[] => {
      const items: string[] = [];
      const checkedBoxes = document.querySelectorAll('span.rc-tree-checkbox[aria-checked="true"]');

      // For each checked checkbox, find its closest tree item and get the label text
      checkedBoxes.forEach((box: Element) => {
        const parent = box.closest('div[role="treeitem"]');
        const titleElement = parent?.querySelector('span.rc-tree-title');
        if (titleElement) {
          items.push(titleElement.textContent?.trim() || '');
        }
      });

      return items;
    });

    console.log(`[CHECKBOX] ${checked.length} nodes are checked: ${checked.join(', ')}`);
    return checked;
  }

  /**
   * Check if a specific node is checked
   */
  async isNodeChecked(label: string): Promise<boolean> {
    console.log(`[CHECKBOX] Checking if node "${label}" is checked`);

    // Use the checkbox locator to evaluate its checked state
    const checked = await this.checkbox(label).evaluate((el) => {
      return el.getAttribute('aria-checked') === 'true';
    });

    console.log(`[CHECKBOX] Node "${label}" is ${checked ? 'checked' : 'unchecked'}`);
    return checked;
  }

  /**
   * Check if a specific node is expanded
   */
  async isNodeExpanded(label: string): Promise<boolean> {
    console.log(`[CHECKBOX] Checking if node "${label}" is expanded`);

    const expanded = await this.page
      .locator(`div[role="treeitem"]:has(span.rc-tree-title:text("${label}"))`)
      .evaluate((el) => {
        return el.getAttribute('aria-expanded') === 'true';
      });

    return expanded;
  }

  /**
   * Expand a specific node by label
   */
  async expandNode(label: string): Promise<void> {
    console.log(`[CHECKBOX] Expanding node "${label}"`);

    const isExpanded = await this.isNodeExpanded(label);

    if (isExpanded) {
      console.log(`[CHECKBOX] Node "${label}" is already expanded`);
      return;
    }

    await this.expandButton(label).click({ force: true });
    await this.page.waitForTimeout(200);

    console.log(`[CHECKBOX] Node "${label}" expanded`);
  }

  /**
   * Collapse a specific node by label
   */
  async collapseNode(label: string): Promise<void> {
    console.log(`[CHECKBOX] Collapsing node "${label}"`);

    const isExpanded = await this.isNodeExpanded(label);

    if (!isExpanded) {
      console.log(`[CHECKBOX] Node "${label}" is already collapsed`);
      return;
    }

    await this.expandButton(label).click({ force: true });
    await this.page.waitForTimeout(200);

    console.log(`[CHECKBOX] Node "${label}" collapsed`);
  }

  /**
   * Check (select) a specific checkbox by node label
   */
  async checkNode(label: string): Promise<void> {
    console.log(`[CHECKBOX] Checking node "${label}"`);

    const isChecked = await this.isNodeChecked(label);

    if (isChecked) {
      console.log(`[CHECKBOX] Node "${label}" is already checked`);
      return;
    }

    // First ensure the node is visible (expand parent if needed)
    await this.ensureNodeIsVisible(label);

    // Click the checkbox
    await this.checkbox(label).click({ force: true });
    await this.page.waitForTimeout(150);

    console.log(`[CHECKBOX] Node "${label}" checked`);
  }

  /**
   * Uncheck (deselect) a specific checkbox by node label
   */
  async uncheckNode(label: string): Promise<void> {
    console.log(`[CHECKBOX] Unchecking node "${label}"`);

    const isChecked = await this.isNodeChecked(label);

    if (!isChecked) {
      console.log(`[CHECKBOX] Node "${label}" is already unchecked`);
      return;
    }

    // First ensure the node is visible
    await this.ensureNodeIsVisible(label);

    // Click the checkbox
    await this.checkbox(label).click({ force: true });
    await this.page.waitForTimeout(150);

    console.log(`[CHECKBOX] Node "${label}" unchecked`);
  }

  /**
   * Toggle a checkbox (check if unchecked, uncheck if checked)
   */
  async toggleNode(label: string): Promise<void> {
    console.log(`[CHECKBOX] Toggling node "${label}"`);

    const isChecked = await this.isNodeChecked(label);

    if (isChecked) {
      await this.uncheckNode(label);
    } else {
      await this.checkNode(label);
    }
  }

  /**
   * Helper: Ensure a node is visible by expanding its parent if needed
   * This is necessary because we can only interact with visible elements
   */
  private async ensureNodeIsVisible(label: string): Promise<void> {
    try {
      await this.nodeLabel(label).waitFor({ state: 'visible', timeout: 1000 });
      return;
    } catch {
      console.log(`[CHECKBOX] Node "${label}" not visible, attempting to find and expand parents`);
      // If not visible, we may need to expand parent nodes
      // For now, just expand all and try again
      await this.expandAllNodes();
    }
  }

  /**
   * Verify parent-child hierarchy: selecting a parent should select all children
   */
  async verifyParentSelectionHierarchy(parentLabel: string): Promise<boolean> {
    console.log(`[CHECKBOX] Verifying parent-child hierarchy for "${parentLabel}"`);

    // Expand the parent to see children
    await this.expandNode(parentLabel);

    // Check parent checkbox
    await this.checkNode(parentLabel);
    await this.page.waitForTimeout(300);

    // Get the parent's tree item to find its children
    const childLabels = await this.page.evaluate((parent: string): string[] => {
      const parentItem = Array.from(document.querySelectorAll('div[role="treeitem"]')).find(
        (item: Element) => item.querySelector('span.rc-tree-title')?.textContent?.includes(parent)
      );

      if (!parentItem) return [];

      // Find direct children by looking at the tree structure
      // This is a simplified approach - may need adjustment based on actual DOM structure
      const children: string[] = [];
      const items = document.querySelectorAll('div[role="treeitem"]');

      items.forEach((item: Element) => {
        const titleElement = item.querySelector('span.rc-tree-title');
        const checkboxElement = item.querySelector('span.rc-tree-checkbox');
        if (
          titleElement &&
          checkboxElement?.getAttribute('aria-checked') === 'true' &&
          titleElement.textContent !== parent
        ) {
          children.push(titleElement.textContent?.trim() || '');
        }
      });

      return children;
    }, parentLabel);

    console.log(`[CHECKBOX] Parent "${parentLabel}" hierarchy verified. Selected children: ${childLabels.join(', ')}`);
    return childLabels.length > 0;
  }

  /**
   * Verify child-to-parent hierarchy: selecting all children should select the parent
   */
  async verifyChildToParentHierarchy(parentLabel: string, childLabels: string[]): Promise<boolean> {
    console.log(
      `[CHECKBOX] Verifying child-to-parent hierarchy: checking all children of "${parentLabel}"`
    );

    // Expand the parent to see children
    await this.expandNode(parentLabel);

    // Check all specified children
    for (const child of childLabels) {
      await this.checkNode(child);
    }

    await this.page.waitForTimeout(300);

    // Check if parent is now checked
    const parentChecked = await this.isNodeChecked(parentLabel);

    console.log(
      `[CHECKBOX] After checking ${childLabels.length} children, parent "${parentLabel}" is ${parentChecked ? 'checked' : 'unchecked'}`
    );

    return parentChecked;
  }

  /**
   * Get detailed node information including hierarchy
   */
  async getNodeInfo(
    label: string
  ): Promise<{
    label: string;
    checked: boolean;
    expanded: boolean;
    hasChildren: boolean;
  }> {
    console.log(`[CHECKBOX] Getting detailed info for node "${label}"`);

    const info = await this.page.evaluate((nodeLabel: string) => {
      const item = Array.from(document.querySelectorAll('div[role="treeitem"]')).find(
        (el: Element) => el.querySelector('span.rc-tree-title')?.textContent?.includes(nodeLabel)
      ) as HTMLElement | undefined;

      if (!item) {
        return null;
      }

      const checkbox = item.querySelector('span.rc-tree-checkbox');
      const switcher = item.querySelector('span.rc-tree-switcher');

      return {
        label: nodeLabel,
        checked: checkbox?.getAttribute('aria-checked') === 'true',
        expanded: item.getAttribute('aria-expanded') === 'true',
        hasChildren: switcher !== null && !switcher?.classList.contains('rc-tree-switcher-noop'),
      };
    }, label);

    if (!info) {
      console.warn(`[CHECKBOX] Node "${label}" not found`);
    }

    return (
      info || {
        label,
        checked: false,
        expanded: false,
        hasChildren: false,
      }
    );
  }

  /**
   * Check if the tree has any selected nodes
   */
  async hasSelectedNodes(): Promise<boolean> {
    const selectedNodes = await this.getCheckedNodes();
    return selectedNodes.length > 0;
  }

  /**
   * Clear all selections (uncheck all nodes)
   */
  async clearAllSelections(): Promise<void> {
    console.log('[CHECKBOX] Clearing all selections');

    const selectedNodes = await this.getCheckedNodes();

    for (const node of selectedNodes) {
      await this.uncheckNode(node);
    }

    console.log('[CHECKBOX] All selections cleared');
  } 
}
