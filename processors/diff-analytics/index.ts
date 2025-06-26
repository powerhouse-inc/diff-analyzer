import {
  AnalyticsPath,
  type AnalyticsSeriesInput,
} from "@powerhousedao/analytics-engine-core";
import { type IProcessor } from "document-drive/processors/types";

import { type InternalTransmitterUpdate } from "document-drive/server/listener/transmitter/internal";
import type { PHDocument } from "document-model";
import { DateTime } from "luxon";
import { diffDocumentStates } from "../../lib/document-diff.js";
import { type IAnalyticsStore } from "@powerhousedao/reactor-api";
import { childLogger } from "document-drive";
import { runAsapAsync } from "document-drive/utils/misc";

export class DiffAnalyticsProcessor implements IProcessor {
  constructor(
    private readonly analyticsStore: IAnalyticsStore,
    private readonly logger = childLogger(["processor", "diff-analytics"]),
  ) {
    //
  }

  async onStrands<TDocument extends PHDocument>(
    strands: InternalTransmitterUpdate<TDocument>[],
  ): Promise<void> {
    if (strands.length === 0) {
      return;
    }

    for (const strand of strands) {
      if (strand.operations.length === 0) {
        continue;
      }

      const firstOp = strand.operations[0];
      const source = AnalyticsPath.fromString(
        `ph/diff/${strand.driveId}/${strand.documentId}/${strand.branch}/${strand.scope}`,
      );

      if (firstOp.index === 0) {
        await this.clearSource(source);
      }

      const CHUNK_SIZE = 50;
      for (let i = 0; i < strand.operations.length; i += CHUNK_SIZE) {
        const chunk = strand.operations.slice(i, i + CHUNK_SIZE);

        const buffer: AnalyticsSeriesInput[] = [];

        for (const operation of chunk) {
          const diff = await runAsapAsync(async () =>
            diffDocumentStates(operation.previousState, operation.state),
          );

          const inputs: AnalyticsSeriesInput[] = diff.changes.map((change) =>
            this.generateInput(
              strand.driveId,
              strand.documentId,
              strand.branch,
              strand.scope,
              operation.index,
              change.type,
              1,
              source,
              operation.timestamp,
              change.path,
            ),
          );

          buffer.push(...inputs);

          while (buffer.length >= CHUNK_SIZE) {
            const batch = buffer.splice(0, CHUNK_SIZE);
            await this.analyticsStore.addSeriesValues(batch);
          }
        }

        // Flush any remaining inputs
        if (buffer.length > 0) {
          await this.analyticsStore.addSeriesValues(buffer);
        }
      }
    }
  }

  async onDisconnect() {}

  private async clearSource(source: AnalyticsPath) {
    try {
      await this.analyticsStore.clearSeriesBySource(source, true);
    } catch (e) {
      this.logger.error("Failed to clear source", e);
    }
  }

  private generateInput(
    driveId: string,
    documentId: string,
    branch: string,
    scope: string,
    revision: number,
    type: string,
    value: number,
    source: AnalyticsPath,
    timestamp: string,
    path: string,
  ) {
    const dimensions: Record<string, AnalyticsPath> = {};

    const changePath = path.split("[")[0].replaceAll(".", "/");

    dimensions.changes = AnalyticsPath.fromString(`ph/diff/changes/${type}`);
    dimensions.document = AnalyticsPath.fromString(
      `ph/diff/document/${documentId}/${branch}/${scope}/${revision}`,
    );
    dimensions.path = AnalyticsPath.fromString(`ph/diff/path/${changePath}`);
    dimensions.drive = AnalyticsPath.fromString(
      `ph/diff/drive/${driveId}/${documentId}`,
    );

    return {
      dimensions,
      metric: "Count",
      start: DateTime.fromISO(timestamp),
      source,
      value,
    };
  }
}
