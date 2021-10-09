import "https://cdn.jsdelivr.net/npm/terser@5.7.0/dist/bundle.min.js";

import {
  ANSI,
  ansi,
  ensureDirectoriesForFile,
  runPiped,
  toModuleFilePath,
  withTemporaryFolder,
} from "./help.ts";

export type BuildFormat = "iife" | "esm";
export type BuildMode = "develop" | "debug" | "optimize";

export type BuildFlags = {
  moduleName: string;
  outputPath: string | null;
  format: BuildFormat;
  mode: BuildMode;
};

export default async function (flags: BuildFlags): Promise<void> {
  const moduleFilePath = await toModuleFilePath(flags.moduleName);
  const output = await makeCompiledSource({ moduleFilePath, ...flags });
  if (flags.outputPath) {
    await ensureDirectoriesForFile(flags.outputPath);
    await Deno.writeTextFile(flags.outputPath, output);
    console.log(
      `${ansi(ANSI.Green, "+")} built ${
        ansi(ANSI.Green, flags.outputPath)
      } from ${flags.moduleName}.${ansi(ANSI.Blue, "main")}`,
    );
  }
}

async function makeCompiledSource(
  flags: { moduleFilePath: string; mode: BuildMode; format: BuildFormat },
): Promise<string> {
  const cmd = ["elm", "make"];
  if (flags.mode !== "develop") cmd.push(`--${flags.mode}`);
  return withTemporaryFolder({}, async (tempDir) => {
    const tempOutputPath = `${tempDir}/main.js`;
    cmd.push(`--output=${tempOutputPath}`, flags.moduleFilePath);
    await runPiped(cmd);
    let output = await Deno.readTextFile(tempOutputPath);
    if (flags.format === "esm") output = exportCompiledSource(output);
    if (flags.mode === "optimize") output = await minifyCompiledSource(output);
    return output;
  });
}

function exportCompiledSource(compiled: string): string {
  return `const scope = {};
${compiled.replace("(this)", "(scope)")}
export const Elm = scope.Elm;`;
}

async function minifyCompiledSource(compiled: string): Promise<string> {
  //
  // This global relies on "Terser", imported at the top.
  //
  const result = await (globalThis as any).Terser.minify(compiled, {
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
