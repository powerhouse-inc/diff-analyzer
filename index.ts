// import * as documentModelsExports from "./document-models/index.js";
// import * as editorsExports from "./editors/index.js";
import { processorFactory } from "./processors/index.js";
import manifestJson from "./powerhouse.manifest.json" with { type: "json" };
import type { Manifest } from "document-model";

export const manifest: Manifest = manifestJson;

export const documentModels = Object.values([]);
export const editors = Object.values([]);
export const processors = processorFactory;

export * from "./lib/document-diff.js";