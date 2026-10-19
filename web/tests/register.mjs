import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import ts from "typescript";
export const load = createRequire(import.meta.url);
load.extensions[".ts"] = (module, filename) => {
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  module._compile(outputText, filename);
};
