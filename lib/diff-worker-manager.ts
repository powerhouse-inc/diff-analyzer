import { type PHDocument } from "document-model";
import { type GlobalStateFromDocument } from "document-model";
import { type DocumentStateDiffSummary } from "./types.js";

interface PendingDiff {
    resolve: (diff: DocumentStateDiffSummary) => void;
    reject: (error: Error) => void;
}

interface WorkerResponse {
    id: string;           // The unique ID to match with the pending diff
    diff?: DocumentStateDiffSummary;  // The calculated diff (if successful)
    error?: string;       // Error message (if something went wrong)
}

export class DiffWorkerManager {
    private worker: Worker;
    private pendingDiffs: Map<string, PendingDiff>;
  
    constructor(_worker: Worker) {
      this.worker = _worker;
      this.pendingDiffs = new Map();
  
      // This is where the Promise gets resolved!
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        // TODO: remove this console.log
        console.log(">>> onmessage");
        const { id, diff, error } = e.data;
        const pendingDiff = this.pendingDiffs.get(id);
  
        if (pendingDiff) {
          if (error) {
            pendingDiff.reject(new Error(error));  // Resolves with error
          } else {
            pendingDiff.resolve(diff as DocumentStateDiffSummary);  // Resolves with success
          }
          this.pendingDiffs.delete(id);
        }
      };
    }
  
    async calculateDiff(
      doc1: GlobalStateFromDocument<PHDocument>,
      doc2: GlobalStateFromDocument<PHDocument>
    ): Promise<DocumentStateDiffSummary> {
      return new Promise((resolve, reject) => {
        console.log(">>> calculateDiff");
        const id = crypto.randomUUID();
        // Store the resolve/reject functions to use them later
        this.pendingDiffs.set(id, { resolve, reject });
        
        // Send message to worker
        this.worker.postMessage({ id, doc1, doc2 });
      });
    }
  }