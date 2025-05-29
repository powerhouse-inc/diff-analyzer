import { type GlobalStateFromDocument, type PHDocument } from "document-model";
import { type DocumentStateChange, type DocumentStateDiffSummary, type DocumentStateAnalyticsData } from "./types.js";


/**
 * Calculates the difference between two document states
 */
export function diffDocumentStates(
  doc1: GlobalStateFromDocument<PHDocument>,
  doc2: GlobalStateFromDocument<PHDocument>,
): DocumentStateDiffSummary {
  const changes: DocumentStateChange[] = [];

  // Compare global state
  const globalChanges = diffStateObjects(
    doc1,
    doc2,
    "state.global",
    "global",
  );
  changes.push(...globalChanges);

  // Count changes by type
  const additions = changes.filter((c) => c.type === "add").length;
  const removals = changes.filter((c) => c.type === "remove").length;

  // Group changes by scope
  const changesByScope = {
    global: changes.filter((c) => c.scope === "global"),
  };

  return {
    totalChanges: changes.length,
    additions,
    removals,
    changesByScope,
    changes,
  };
}

/**
 * Recursively compares two state objects and returns a list of changes
 */
function diffStateObjects(
  obj1: unknown,
  obj2: unknown,
  path: string,
  scope: "global" | "local",
): DocumentStateChange[] {
  const changes: DocumentStateChange[] = [];

  // Handle primitive values
  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    if (obj1 !== obj2) {
      // Special handling for strings to diff character by character
      if (typeof obj1 === "string" && typeof obj2 === "string") {
        return diffStateStrings(obj1, obj2, path, scope);
      } else {
        // For non-string primitives, treat a change as a remove + add
        changes.push({
          type: "remove",
          path,
          oldValue: obj1,
          scope,
        });
        changes.push({
          type: "add",
          path,
          newValue: obj2,
          scope,
        });
      }
    }
    return changes;
  }

  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    // Compare array lengths
    if (obj1.length !== obj2.length) {
      // For arrays with different lengths, treat as a remove + add
      changes.push({
        type: "remove",
        path,
        oldValue: obj1,
        scope,
      });
      changes.push({
        type: "add",
        path,
        newValue: obj2,
        scope,
      });
      return changes;
    }

    // Compare array elements
    for (let i = 0; i < obj1.length; i++) {
      const elementChanges = diffStateObjects(
        obj1[i],
        obj2[i],
        `${path}[${i}]`,
        scope,
      );
      changes.push(...elementChanges);
    }
    return changes;
  }

  // Handle objects
  const obj1Record = obj1 as Record<string, unknown>;
  const obj2Record = obj2 as Record<string, unknown>;
  const obj1Keys = Object.keys(obj1Record);
  const obj2Keys = Object.keys(obj2Record);

  // First, check for removed keys
  for (const key of obj1Keys) {
    if (!(key in obj2Record)) {
      // Key was removed
      changes.push({
        type: "remove",
        path: `${path}.${key}`,
        oldValue: obj1Record[key],
        scope,
      });
    }
  }

  // Then, check for added keys and modified values
  for (const key of obj2Keys) {
    if (!(key in obj1Record)) {
      // Key was added
      changes.push({
        type: "add",
        path: `${path}.${key}`,
        newValue: obj2Record[key],
        scope,
      });
    } else if (obj1Record[key] !== obj2Record[key]) {
      // For object changes, recursively diff the objects
      const nestedChanges = diffStateObjects(
        obj1Record[key],
        obj2Record[key],
        `${path}.${key}`,
        scope,
      );
      changes.push(...nestedChanges);
    }
  }

  return changes;
}

/**
 * Compares two strings character by character and returns a list of changes
 */
function diffStateStrings(
  str1: string,
  str2: string,
  path: string,
  scope: "global" | "local",
): DocumentStateChange[] {
  const changes: DocumentStateChange[] = [];
  const maxLen = Math.max(str1.length, str2.length);

  for (let i = 0; i < maxLen; i++) {
    if (i >= str1.length) {
      // Addition of new character
      changes.push({
        type: "add",
        path: `${path}[${i}]`,
        newValue: str2[i],
        scope,
      });
    } else if (i >= str2.length) {
      // Removal of character
      changes.push({
        type: "remove",
        path: `${path}[${i}]`,
        oldValue: str1[i],
        scope,
      });
    } else if (str1[i] !== str2[i]) {
      // Character changed
      changes.push({
        type: "remove",
        path: `${path}[${i}]`,
        oldValue: str1[i],
        scope,
      });
      changes.push({
        type: "add",
        path: `${path}[${i}]`,
        newValue: str2[i],
        scope,
      });
    }
  }

  return changes;
}

/**
 * Generates analytics data from a state diff summary
 */
export function generateStateAnalyticsData(
  diff: DocumentStateDiffSummary,
): DocumentStateAnalyticsData {
  return {
    totalChanges: diff.totalChanges,
    changesByType: {
      add: diff.additions,
      remove: diff.removals,
    },
    changesByScope: {
      global: diff.changesByScope.global.length,
    },
    changePaths: diff.changes.map((c) => c.path),
  };
}
