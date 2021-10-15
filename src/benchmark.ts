import { ANSI, ansi, runPiped, withTemporaryFolder } from "./help.ts";

import { benchmarkModule } from "../build/template.ts";

export type BenchmarkFlags = {
  moduleName: string;
  benchmarkName: string;
};

export default async function (flags: BenchmarkFlags) {
  await withTemporaryFolder<void>(
    {},
    async (tempDirPath) => {
      await Deno.writeTextFile(
        `${tempDirPath}/RunBenchmark.elm`,
        benchmarkModule.replace("import", `import ${flags.moduleName}\nimport`)
          .replace(
            "benchmark",
            `${flags.moduleName}.${flags.benchmarkName}`,
          ),
      );
      await runPiped(
        [
          "elm",
          "make",
          `--output=${tempDirPath}/runBenchmark.js`,
          `${tempDirPath}/RunBenchmark.elm`,
        ],
      );

      const compiled = await Deno.readTextFile(
        `${tempDirPath}/runBenchmark.js`,
      );
      eval(compiled.replace("(this)", "(globalThis)"));
      return new Promise((resolve) =>
        (globalThis as any).Elm.RunBenchmark.init({ flags: flags }).ports.output
          .subscribe(
            (output: String) => {
              console.log(output);
              resolve();
            },
          )
      );
    },
  );
  console.log(
    `\n${
      ansi(ANSI.Green, "▶")
    } ran using the v8 javascript engine, v${Deno.version.v8}`,
  );
  Deno.exit(0);
}
