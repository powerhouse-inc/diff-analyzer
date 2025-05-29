import { type PHDocument } from "document-model";
import { type GlobalStateFromDocument } from "document-model";

/**
 * Represents a change in a document state
 */
export interface DocumentStateChange {
  type: "add" | "remove";
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
  scope: "global" | "local";
}

/**
 * Summary of changes in a document state
 */
export interface DocumentStateDiffSummary {
  totalChanges: number;
  additions: number;
  removals: number;
  changesByScope: {
    global: DocumentStateChange[];
  };
  changes: DocumentStateChange[];
}

/**
 * Analytics data generated from a state diff summary
 */
export interface DocumentStateAnalyticsData {
  totalChanges: number;
  changesByType: {
    add: number;
    remove: number;
  };
  changesByScope: {
    global: number;
  };
  changePaths: string[];
}

export interface PendingDiff {
  resolve: (diff: DocumentStateDiffSummary) => void;
  reject: (error: Error) => void;
}

export interface WorkerResponse {
  id: string;           // The unique ID to match with the pending diff
  diff?: DocumentStateDiffSummary;  // The calculated diff (if successful)
  error?: string;       // Error message (if something went wrong)
}

export interface WorkerMessage {
  id: string;
  doc1: GlobalStateFromDocument<PHDocument>;
  doc2: GlobalStateFromDocument<PHDocument>;
}