import log, { LogConfiguration } from "./log.ts";
import build, { BuildConfiguration } from "./build.ts";
import serve, { ServeConfiguration } from "./serve.ts";
import test, { TestConfiguration } from "./test.ts";
import {
  runPiped,
  sequencePromises,
  toModuleFilePath,
  withTemporaryFolder,
} from "./help.ts";

import { mainModule, version } from "../build/template.ts";

type Configuration =
  | {
    type: "Batch";
    value: Array<Configuration>;
  }
  | {
    type: "Sequence";
    value: Array<Configuration>;
  }
  | {
    type: "OneOf";
    value: { [key: string]: Configuration | undefined };
  }
  | {
    type: "Log";
    value: LogConfiguration;
  }
  | {
    type: "Build";
    value: BuildConfiguration;
  }
  | {
    type: "Serve";
    value: ServeConfiguration;
  }
  | { type: "Test"; value: TestConfiguration };

export type DevelopmentConfiguration = {
  packageModuleSource: string;
};

export default async function (
  args: Array<string>,
  devConfig?: DevelopmentConfiguration,
) {
  const config = await withTemporaryFolder(
    { prefix: "develm" },
    toReadConfiguration(devConfig),
  );
  await toRunConfiguration(args)(config);
}
// Configuration

function toReadConfiguration(devConfig?: DevelopmentConfiguration) {
  return async (tempDirPath: string): Promise<Configuration> => {
    const configFilePath = await toModuleFilePath("Dev");
    await Promise.all([
      Deno.writeTextFile(`${tempDirPath}/RunMain.elm`, mainModule),
      Deno.writeTextFile(
        `${tempDirPath}/elm.json`,
        JSON.stringify(toElmJson(devConfig)),
      ),
      Deno.writeTextFile(
        `${tempDirPath}/Dev.elm`,
        await Deno.readTextFile(configFilePath),
      ),
    ]);

    if (devConfig) {
      await Deno.writeTextFile(
        `${tempDirPath}/DevElm.elm`,
        devConfig.packageModuleSource,
      );
    }
    await runPiped(
      [
        "elm",
        "make",
        `--output=runMain.js`,
        "RunMain.elm",
      ],
      tempDirPath,
    );

    const compiled = await Deno.readTextFile(
      `${tempDirPath}/runMain.js`,
    );
    let scope: any = {};
    eval(compiled.replace("(this)", "(scope)"));
    return await new Promise((resolve) =>
      scope.Elm.RunMain.init().ports.output.subscribe(resolve)
    );
  };
}

function toRunConfiguration(args: Array<string>) {
  return async (config: Configuration): Promise<void> => {
    switch (config.type) {
      case "Batch":
        await Promise.all(config.value.map(toRunConfiguration(args)));
        break;
      case "Sequence":
        await sequencePromises(
          config.value.map((config) => () => toRunConfiguration(args)(config)),
          undefined,
        );
        break;
      case "OneOf":
        const configAtKey = config.value[args[0]];
        if (configAtKey === undefined) {
          throw `I didn't recognize "${args[0]}". Did you mean one of these?: ${
            Object.keys(config.value)
              .map((str) => `\n - ${str}`)
              .join("")
          }`;
        }
        await toRunConfiguration(args.slice(1))(configAtKey);
        break;

      case "Log":
        log(version, config.value);
        break;
      case "Build":
        await build(config.value);
        break;
      case "Serve":
        await serve(config.value);
        break;

      case "Test":
        await test(config.value);
        break;

      default:
        throw `unrecognized configuration: ${JSON.stringify(config)}`;
    }
  };
}

function toElmJson(devConfig?: DevelopmentConfiguration) {
  const direct: { [key: string]: string } = {
    "elm/core": "1.0.5",
    "elm/json": "1.1.3",
  };

  if (!devConfig) {
    direct["opvasger/develm"] = version.join(".");
  }
  return {
    type: "application",
    "source-directories": ["."],
    "elm-version": "0.19.1",
    dependencies: {
      direct,
      indirect: {},
    },
    "test-dependencies": {
      direct: {},
      indirect: {},
    },
  };
}
