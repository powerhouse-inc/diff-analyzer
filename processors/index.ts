/**
 * This is a scaffold file meant for customization.
 * Delete the file and run the code generator again to have it reset
 */

import { type ProcessorRecord } from "document-drive/processors/types";
import { DiffAnalyticsProcessor } from "./diff-analytics";

export const processorFactory =
  (module: any) =>
  (driveId: string): ProcessorRecord[] => {
    console.log(">>>>>>processorFactory", driveId);

    return [
      {
        processor: new DiffAnalyticsProcessor(module.analyticsStore),
        filter: {
          branch: ["main"],
          documentId: ["*"],
          scope: ["*"],
          documentType: ["*"],
        },
      },
    ];
  };
