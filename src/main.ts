import log, { LogConfiguration } from "./main/log.ts";
import build, { BuildConfiguration } from "./main/build.ts";
import {
  sequencePromises,
  withTemporaryFolder,
  runPiped,
} from "../src/help.ts";

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

export const version: [number, number, number] = [2, 0, 0];

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

function toRunConfiguration(args: Array<string>) {
  return async (config: Configuration): Promise<void> => {
    switch (config.type) {
      case "Log":
        log(version, config.value);
        break;
      case "Build":
        await build(config.value);
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
          throw `invalid argument ${args[0]}. Expected one of: ${Object.keys(
            config.value
          ).join(",")}`;
        await toRunConfiguration(args.slice(1))(configAtKey);
        break;

      default:
        throw `unrecognized configuration: ${JSON.stringify(config)}`;
    }
  };
}

function toReadConfiguration(devConfig?: DevelopmentConfiguration) {
  return async (tempDirPath: string): Promise<Configuration> => {
    const moduleFileName = "Main.elm";
    const compiledFileName = "main.js";
    const configFileName = "Dev.elm";
    await Deno.writeTextFile(`${tempDirPath}/${moduleFileName}`, elmModule);
    await Deno.writeTextFile(
      `${tempDirPath}/elm.json`,
      JSON.stringify(toElmJson(devConfig))
    );
    await Deno.writeTextFile(
      `${tempDirPath}/${configFileName}`,
      await Deno.readTextFile(configFileName)
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

    const scope: any = {};
    eval(
      (await Deno.readTextFile(`${tempDirPath}/${compiledFileName}`)).replace(
        "(this)",
        "(scope)"
      )
    );
    return await new Promise(function (resolve) {
      scope.Elm.Main.init().ports.output.subscribe(resolve);
    });
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

const elmModule = `port module Main exposing (main)

import Json.Encode
import Dev
import DevElm

port output : Json.Encode.Value -> Cmd msg

main : Program () () ()
main = Platform.worker 
  { init = always ((), output (DevElm.encodeConfiguration Dev.config))
  , update = (always (always ((), Cmd.none)))
  , subscriptions = always Sub.none
  }
`;
