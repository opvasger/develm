import { runPiped, toModuleFilePath, withTemporaryFolder } from "./help.ts";

import { testModule } from "../build/template.ts";

export type TestConfiguration = {
  seed: number | null;
  fuzz: number;
  moduleName: string;
  testName: string;
};

export default async function (config: TestConfiguration) {
  const exitCode = await withTemporaryFolder<number>(
    {},
    async (tempDirPath) => {
      await Deno.writeTextFile(
        `${tempDirPath}/RunTest.elm`,
        testModule.replace("import", `import ${config.moduleName}\nimport`)
          .replace(
            "suite",
            `${config.moduleName}.${config.testName}`,
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
      let scope: any = {};
      eval(compiled.replace("(this)", "(scope)"));
      return new Promise((resolve) =>
        scope.Elm.RunTest.init({ flags: config }).ports.output.subscribe(
          (output: { message: String; exitCode: number | null }) => {
            console.log(output.message);
            if (typeof output.exitCode === "number") resolve(output.exitCode);
          },
        )
      );
    },
  );

  Deno.exit(exitCode);
}
