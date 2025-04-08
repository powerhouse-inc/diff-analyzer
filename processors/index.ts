/**
 * This is a scaffold file meant for customization.
 * Delete the file and run the code generator again to have it reset
 */

import {
  ProcessorFactory,
  ReactorModule,
  ProcessorRecord,
} from "@powerhousedao/reactor-api";
import { DiffAnalyticsProcessor } from "./diff-analytics/index.js";

export const processorFactory: ProcessorFactory = (
  driveId: string,
  module: ReactorModule,
): ProcessorRecord[] => {
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
