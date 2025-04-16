import { describe, expect, it } from "vitest";
import {
  diffDocumentStates,
  generateStateAnalyticsData,
  type DocumentStateChange,
  type DocumentStateDiffSummary,
} from "../lib/document-diff.js";
import { type PHDocument } from "document-model";

/**
 * Test state types for document state diffing
 */
type TestGlobalState = {
  title: string;
  description: string;
  tags: string[];
  metadata: {
    author: string;
    version: number;
  };
};

type TestState = {
  global: TestGlobalState;
  local: Record<string, unknown>;
};

describe("Document State Diffing", () => {
  /**
   * Creates a mock document for testing
   */
  const createMockDocument = (
    overrides: Partial<PHDocument> = {},
  ): PHDocument => {
    const baseDoc: PHDocument = {
      name: "Test Document",
      revision: { global: 0, local: 0 },
      documentType: "test",
      created: "2023-01-01T00:00:00Z",
      lastModified: "2023-01-01T00:00:00Z",
      state: {
        global: {
          title: "Test Title",
          description: "Test Description",
          tags: ["test", "document"],
          metadata: {
            author: "Test Author",
            version: 1,
          },
        },
        local: {},
      },
      operations: {
        global: [],
        local: [],
      },
      initialState: {
        name: "Test Document",
        revision: { global: 0, local: 0 },
        documentType: "test",
        created: "2023-01-01T00:00:00Z",
        lastModified: "2023-01-01T00:00:00Z",
        state: {
          global: {
            title: "Test Title",
            description: "Test Description",
            tags: ["test", "document"],
            metadata: {
              author: "Test Author",
              version: 1,
            },
          },
          local: {},
        },
      },
      clipboard: [],
    };
    return { ...baseDoc, ...overrides };
  };

  describe("diffDocumentStates", () => {
    it("should detect no changes when document states are identical", () => {
      const doc1 = createMockDocument();
      const doc2 = createMockDocument();

      const diff = diffDocumentStates(doc1.state.global, doc2.state.global);

      expect(diff.totalChanges).toBe(0);
      expect(diff.additions).toBe(0);
      expect(diff.removals).toBe(0);
    });

    it("should detect changes in global state", () => {
      const doc1 = createMockDocument();
      const doc2 = createMockDocument({
        state: {
          global: {
            title: "Updated Title",
            description: "Test Description",
            tags: ["test", "document"],
            metadata: {
              author: "Test Author",
              version: 2,
            },
          },
          local: {},
        },
      });

      const diff = diffDocumentStates(doc1.state.global, doc2.state.global);

      // For title change: "Test Title" -> "Updated Title"
      // - Remove: T,e,s,t, ,T,i,t,l,e (10 chars)
      // - Add: U,p,d,a,t,e,d, ,T,i,t,l,e (13 chars)
      // For version change: 1 -> 2 (primitive number, counts as 1 remove + 1 add)
      expect(diff.totalChanges).toBe(25); // 23 for title (10 removes + 13 adds) + 2 for version
      expect(diff.additions).toBe(14); // 13 for title + 1 for version
      expect(diff.removals).toBe(11); // 10 for title + 1 for version

      // Check specific changes
      const titleChanges = diff.changes.filter((c) =>
        c.path.startsWith("state.global.title"),
      );
      expect(titleChanges.length).toBe(23); // 10 removes + 13 adds

      // Check first character change (T -> U)
      const firstCharChanges = titleChanges.filter(
        (c) => c.path === "state.global.title[0]",
      );
      expect(firstCharChanges.length).toBe(2);
      expect(firstCharChanges.find((c) => c.type === "remove")?.oldValue).toBe(
        "T",
      );
      expect(firstCharChanges.find((c) => c.type === "add")?.newValue).toBe(
        "U",
      );

      const versionChanges = diff.changes.filter(
        (c) => c.path === "state.global.metadata.version",
      );
      expect(versionChanges.length).toBe(2);
      expect(versionChanges.find((c) => c.type === "remove")?.oldValue).toBe(1);
      expect(versionChanges.find((c) => c.type === "add")?.newValue).toBe(2);
    });

    it("should detect additions and removals in state", () => {
      const doc1 = createMockDocument();
      const doc2 = createMockDocument({
        state: {
          global: {
            title: "Updated Title",
            tags: ["test", "document"],
            metadata: {
              author: "Test Author",
              version: 2,
            },
            newField: "New Value",
          },
          local: {},
        },
      });

      const diff = diffDocumentStates(doc1.state.global, doc2.state.global);

      // Calculate expected changes:
      // 1. title: "Test Title" -> "Updated Title" = 23 changes (10 removes + 13 adds)
      // 2. description: removed = 1 change
      // 3. version: 1 -> 2 = 2 changes (1 remove + 1 add)
      // 4. newField: added with "New Value" = 1 change
      expect(diff.totalChanges).toBe(27);
      expect(diff.additions).toBe(15); // 13 for title + 1 for version + 1 for newField
      expect(diff.removals).toBe(12); // 10 for title + 1 for description + 1 for version

      // Check specific changes
      const titleChanges = diff.changes.filter((c) =>
        c.path.startsWith("state.global.title"),
      );
      expect(titleChanges.length).toBe(23); // 10 removes + 13 adds

      const descriptionChange = diff.changes.find(
        (c) => c.path === "state.global.description",
      );
      expect(descriptionChange).toBeDefined();
      expect(descriptionChange?.type).toBe("remove");
      expect(descriptionChange?.oldValue).toBe("Test Description");

      const newFieldChange = diff.changes.find(
        (c) => c.path === "state.global.newField",
      );
      expect(newFieldChange).toBeDefined();
      expect(newFieldChange?.type).toBe("add");
      expect(newFieldChange?.newValue).toBe("New Value");

      const versionChanges = diff.changes.filter(
        (c) => c.path === "state.global.metadata.version",
      );
      expect(versionChanges.length).toBe(2);
      expect(versionChanges.find((c) => c.type === "remove")?.oldValue).toBe(1);
      expect(versionChanges.find((c) => c.type === "add")?.newValue).toBe(2);
    });

    it("should detect character-by-character changes in state strings", () => {
      const doc1 = createMockDocument({
        state: {
          global: {
            title: "frank",
            description: "Test Description",
            tags: ["test"],
            metadata: {
              author: "Test Author",
              version: 1,
            },
          },
          local: {},
        },
      });

      const doc2 = createMockDocument({
        state: {
          global: {
            title: "marti",
            description: "Test Description",
            tags: ["test"],
            metadata: {
              author: "Test Author",
              version: 1,
            },
          },
          local: {},
        },
      });

      const diff = diffDocumentStates(doc1.state.global, doc2.state.global);

      // We expect 10 changes: 5 removes (f,r,a,n,k) + 5 adds (m,a,r,t,i)
      expect(diff.totalChanges).toBe(10);
      expect(diff.additions).toBe(5);
      expect(diff.removals).toBe(5);

      // Check specific changes
      const titleChanges = diff.changes.filter((c) =>
        c.path.startsWith("state.global.title"),
      );
      expect(titleChanges.length).toBe(10);

      // Verify first character change (f -> m)
      const firstCharChanges = titleChanges.filter(
        (c) => c.path === "state.global.title[0]",
      );
      expect(firstCharChanges.length).toBe(2);
      expect(firstCharChanges.find((c) => c.type === "remove")?.oldValue).toBe(
        "f",
      );
      expect(firstCharChanges.find((c) => c.type === "add")?.newValue).toBe(
        "m",
      );
    });
  });

  describe("generateStateAnalyticsData", () => {
    it("should generate analytics data from a state diff summary", () => {
      const mockDiff: DocumentStateDiffSummary = {
        totalChanges: 5,
        additions: 3,
        removals: 2,
        changesByScope: {
          global: [
            {
              type: "add",
              path: "state.global.field1",
              newValue: "value1",
              scope: "global",
            } as DocumentStateChange,
            {
              type: "remove",
              path: "state.global.field2",
              oldValue: "value2",
              scope: "global",
            } as DocumentStateChange,
          ],
        },
        changes: [
          {
            type: "add",
            path: "state.global.field1",
            newValue: "value1",
            scope: "global",
          } as DocumentStateChange,
          {
            type: "remove",
            path: "state.global.field2",
            oldValue: "value2",
            scope: "global",
          } as DocumentStateChange,
        ],
      };

      const analyticsData = generateStateAnalyticsData(mockDiff);
      expect(analyticsData.totalChanges).toBe(5);
      expect(analyticsData.changesByType.add).toBe(3);
      expect(analyticsData.changesByType.remove).toBe(2);
      expect(analyticsData.changesByScope.global).toBe(2);
      expect(analyticsData.changePaths).toContain("state.global.field1");
      expect(analyticsData.changePaths).toContain("state.global.field2");
    });
  });
});
