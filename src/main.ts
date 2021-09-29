import log, { LogConfiguration } from "./main/log.ts";
import build, { BuildConfiguration } from "./main/build.ts";
import serve, { ServeConfiguration } from "./main/serve.ts";
import {
  sequencePromises,
  withTemporaryFolder,
  runPiped,
} from "../src/help.ts";

import { version, elmModule } from "../build/template.ts";

type Configuration =
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
    };

export type DevelopmentConfiguration = {
  packageModuleSource: string;
};

export default async function (
  args: Array<string>,
  devConfig?: DevelopmentConfiguration
) {
  const config = await withTemporaryFolder(
    { prefix: "develm" },
    toReadConfiguration(devConfig)
  );

  await toRunConfiguration(args)(config);
}

// Configuration
function toReadConfiguration(devConfig?: DevelopmentConfiguration) {
  return async (tempDirPath: string): Promise<Configuration> => {
    const moduleFileName = "Main.elm";
    const compiledFileName = "main.js";
    const configFilePath = await Promise.any<string>(
      JSON.parse(await Deno.readTextFile("elm.json"))["source-directories"].map(
        async (srcDir: string) => {
          const configFilePath = `${srcDir}/Dev.elm`;
          const { isFile } = await Deno.lstat(configFilePath);
          if (isFile) {
            return configFilePath;
          }
        }
      )
    );
    await Deno.writeTextFile(`${tempDirPath}/${moduleFileName}`, elmModule);
    await Deno.writeTextFile(
      `${tempDirPath}/elm.json`,
      JSON.stringify(toElmJson(devConfig))
    );
    await Deno.writeTextFile(
      `${tempDirPath}/Dev.elm`,
      await Deno.readTextFile(configFilePath)
    );

    if (devConfig) {
      await Deno.writeTextFile(
        `${tempDirPath}/DevElm.elm`,
        devConfig.packageModuleSource
      );
    }
    await runPiped(
      [
        "elm",
        "make",
        "--optimize",
        `--output=${compiledFileName}`,
        moduleFileName,
      ],
      tempDirPath
    );

    const compiled = await Deno.readTextFile(
      `${tempDirPath}/${compiledFileName}`
    );
    eval(compiled.replace("(this)", "(globalThis)"));
    return await new Promise((resolve) =>
      (globalThis as any).Elm.Main.init().ports.output.subscribe(resolve)
    );
  };
}

function toRunConfiguration(args: Array<string>) {
  return async (config: Configuration): Promise<void> => {
    switch (config.type) {
      case "Log":
        log(version, config.value);
        break;
      case "Build":
        await build(config.value);
        break;
      case "Serve":
        await serve(config.value);
        break;
      case "Batch":
        await Promise.all(config.value.map(toRunConfiguration(args)));
        break;
      case "Sequence":
        await sequencePromises(
          config.value.map((config) => () => toRunConfiguration(args)(config)),
          undefined
        );
        break;
      case "OneOf":
        const configAtKey = config.value[args[0]];
        if (configAtKey === undefined)
          return console.log(
            `I didn't recognize "${
              args[0]
            }". Did you mean one of these?: ${Object.keys(config.value)
              .map((str) => `\n - ${str}`)
              .join("")}`
          );
        await toRunConfiguration(args.slice(1))(configAtKey);
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
