import "https://cdn.jsdelivr.net/npm/terser@5.7.0/dist/bundle.min.js";

import { withTemporaryFolder, runPiped } from "../help.ts";

export type BuildConfiguration = {
  moduleName: string;
  outputPath: string | null;
  format: "iife" | "esm";
  mode: "develop" | "debug" | "optimize";
};

export default async function (config: BuildConfiguration): Promise<void> {
  const moduleFilePath = await Promise.any<string>(
    JSON.parse(await Deno.readTextFile("elm.json"))["source-directories"].map(
      async (srcDir: string) => {
        const moduleFilePath = `${srcDir}/${config.moduleName}.elm`;
        const { isFile } = await Deno.lstat(
          `${srcDir}/${config.moduleName}.elm`
        );
        if (isFile) {
          return moduleFilePath;
        }
      }
    )
  );
  const compiledFileName = "main.js";
  const cmd = ["elm", "make"];
  if (config.mode !== "develop") cmd.push(`--${config.mode}`);
  await withTemporaryFolder({}, async (tempDir) => {
    const tempOutputPath = `${tempDir}/${compiledFileName}`;
    cmd.push(`--output=${tempOutputPath}`, moduleFilePath);
    await runPiped(cmd);
    let output = await Deno.readTextFile(tempOutputPath);
    if (config.format === "esm") output = exportCompiledSource(output);
    if (config.mode === "optimize") output = await minifyCompiledSource(output);
    if (config.outputPath) {
      Deno.mkdir(config.outputPath.split("/").slice(0, -1).join("/"), {
        recursive: true,
      });
      return await Deno.writeTextFile(config.outputPath, output);
    }
  });
}

function exportCompiledSource(compiled: string): string {
  return `const scope = {};
${compiled.replace("(this)", "(scope)")}
export const Elm = scope.Elm;`;
}

async function minifyCompiledSource(compiled: string): Promise<string> {
  //
  // This global relies on the project imported at the top.
  //
  const { minify } = (globalThis as any).Terser;
  const result = await minify(compiled, {
    mangle: true,
    compress: {
      pure_getters: true,
      keep_fargs: false,
      unsafe_comps: true,
      unsafe: true,
      pure_funcs: [
        "F2",
        "F3",
        "F4",
        "F5",
        "F6",
        "F7",
        "F8",
        "F9",
        "A2",
        "A3",
        "A4",
        "A5",
        "A6",
        "A7",
        "A8",
        "A9",
      ],
    },
  });

  return result.code;
}
