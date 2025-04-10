/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  AnalyticsPath,
  AnalyticsSeriesInput,
  type IAnalyticsStore,
} from "@powerhousedao/reactor-api";
import { IProcessor } from "document-drive/processors/types";

import {
  type InternalTransmitterUpdate,
} from "document-drive/server/listener/transmitter/internal";
import type { PHDocument } from "document-model";
import {
  diffDocumentStates
} from "../../lib/document-diff";
import { DateTime } from "luxon";

export class DiffAnalyticsProcessor implements IProcessor {
  constructor(private readonly analyticsStore: IAnalyticsStore) {
    //
  }

  async onStrands<TDocument extends PHDocument>(
    strands: InternalTransmitterUpdate<TDocument>[]
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
        `ph/${strand.driveId}/${strand.documentId}/${strand.branch}/${strand.scope}`
      );

      if (firstOp.index === 0) {
        await this.clearSource(source);
      }

      for (const operation of strand.operations) {
        console.log(">>> ", operation.type);
        const diff = diffDocumentStates(
          operation.previousState,
          operation.resultingState
        );

        if (!diff) {
          continue;
        }

        inputs.push(
          this.generateInput(
            strand.documentId,
            strand.branch,
            strand.scope,
            operation.index,
            "additions",
            diff.additions,
            source,
            operation.timestamp
          ),
          this.generateInput(
          strand.documentId,
          strand.branch,
          strand.scope,
            operation.index,
            "removals",
            diff.removals,
            source,
            operation.timestamp
          ),
          this.generateInput(
            strand.documentId,
          strand.branch,
          strand.scope,
          operation.index,
          "total",
            diff.totalChanges,
            source,
            operation.timestamp
          )
        );

        console.log(">>> ", diff);
      }
    }

    await this.analyticsStore.addSeriesValues(inputs);
  }

  async onDisconnect() {}

  private async clearSource(source: AnalyticsPath) {
    try {
      await this.analyticsStore.clearSeriesBySource(source, true);
    } catch (e) {
      console.error(e);
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
    timestamp: string
  ) {
    const dimensions: Record<string, AnalyticsPath> = {};

    dimensions[type] = AnalyticsPath.fromString(`ph/changes/${type}`);

    dimensions.revision = AnalyticsPath.fromString(
      `ph/${documentId}/${branch}/${scope}/${revision}`
    );

    return {
      dimensions,
      metric: "Count",
      start: DateTime.fromISO(timestamp),
      source,
      value,
    }
  }
}
