import * as documentModelsExports from "./document-models";
import * as editorsExports from "./editors";
import { processorFactory } from "processors";

export const documentModels = Object.values(documentModelsExports);
export const editors = Object.values(editorsExports);
export const processors = processorFactory;
