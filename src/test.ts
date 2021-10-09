import { randomInt, runPiped, withTemporaryFolder } from "./help.ts";

import { testModule } from "../build/template.ts";

export type TestFlags = {
  seed: number | null;
  fuzz: number;
  moduleName: string;
  testName: string;
};

export default async function (flags: TestFlags) {
  const exitCode = await withTemporaryFolder<number>(
    {},
    async (tempDirPath) => {
      await Deno.writeTextFile(
        `${tempDirPath}/RunTest.elm`,
        testModule.replace("import", `import ${flags.moduleName}\nimport`)
          .replace(
            "suite",
            `${flags.moduleName}.${flags.testName}`,
          ),
      );
      await runPiped(
        [
          "elm",
          "make",
          `--output=${tempDirPath}/runTest.js`,
          `${tempDirPath}/RunTest.elm`,
        ],
      );

      const compiled = await Deno.readTextFile(
        `${tempDirPath}/runTest.js`,
      );
      flags.seed = flags.seed !== null ? flags.seed : randomInt();
      eval(compiled.replace("(this)", "(globalThis)"));
      return new Promise((resolve) =>
        (globalThis as any).Elm.RunTest.init({ flags: flags }).ports.output
          .subscribe(
            (output: { message: String; exitCode: number }) => {
              console.log(output.message);
              resolve(output.exitCode);
            },
          )
      );
    },
  );

  Deno.exit(exitCode);
}
