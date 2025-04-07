import { generateId } from "document-model";
import type {
  AnalyticsProcessor,
  ProcessorOptions,
  ProcessorUpdate,
  AnalyticsPath,
} from "@powerhousedao/reactor-api";
import type { PHDocument } from "document-model";
type DocumentType = PHDocument;

export class DiffProcessorProcessor extends AnalyticsProcessor {
  protected processorOptions: ProcessorOptions = {
    listenerId: generateId(),
    filter: {
      branch: ["main"],
      documentId: ["*"],
      documentType: ["*"],
      scope: ["global"],
    },
    block: false,
    label: "diff-processor",
    system: true,
  };

  async onStrands(strands: ProcessorUpdate<DocumentType>[]): Promise<void> {
    if (strands.length === 0) {
      return;
    }

    for (const strand of strands) {
      if (strand.operations.length === 0) {
        continue;
      }

      const firstOp = strand.operations[0];
      const source = AnalyticsPath.fromString(
        `ph/${strand.driveId}/${strand.documentId}/${strand.branch}/${strand.scope}`,
      );
      if (firstOp.index === 0) {
        await this.clearSource(source);
      }

      for (const operation of strand.operations) {
        console.log(">>> ", operation.type);
      }
    }
  }

  async onDisconnect() {}

  private async clearSource(source: AnalyticsPath) {
    try {
      await this.analyticsStore.clearSeriesBySource(source, true);
    } catch (e) {
      console.error(e);
    }
  }
}
