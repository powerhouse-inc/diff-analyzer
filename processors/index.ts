/**
 * This is a scaffold file meant for customization.
 * Delete the file and run the code generator again to have it reset
 */

import { type ProcessorRecord } from "document-drive/processors/types";
import { DiffAnalyticsProcessor } from "./diff-analytics/index.js";
import { type IAnalyticsStore } from "@powerhousedao/reactor-api";
import { type DiffWorkerManager } from "../lib/diff-worker-manager.js";

export const processorFactory =
  (module: { analyticsStore: IAnalyticsStore, diffWorkerManager: DiffWorkerManager }) =>
  (driveId: string): ProcessorRecord[] => {
    return [
      {
        processor: new DiffAnalyticsProcessor(
          module.analyticsStore,
          undefined,
          module.diffWorkerManager
        ),
        filter: {
          branch: ["main"],
          documentId: ["*"],
          scope: ["*"],
          documentType: ["*"],
        },
      },
    ];
  };
