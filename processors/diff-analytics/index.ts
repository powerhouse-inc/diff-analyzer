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

    const inputs: AnalyticsSeriesInput[] = [];
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
        const diff = diffDocumentStates(
          operation.previousState,
          operation.state,
        );

        for (const change of diff.changes) {
          inputs.push(
            this.generateInput(
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
        }
      }
    }

    if (inputs.length) {
      await this.analyticsStore.addSeriesValues(inputs);
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

    dimensions.changes = AnalyticsPath.fromString(`changes/${type}`);
    dimensions.document = AnalyticsPath.fromString(
      `document/${documentId}/${branch}/${scope}/${revision}`,
    );
    dimensions.path = AnalyticsPath.fromString(`path/${changePath}`);

    return {
      dimensions,
      metric: "Count",
      start: DateTime.fromISO(timestamp),
      source,
      value,
    };
  }
}
