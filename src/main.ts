import log, { LogFlags } from "./log.ts";
import build, { BuildFlags } from "./build.ts";
import serve, { ServeFlags } from "./serve.ts";
import test, { TestFlags } from "./test.ts";
import {
  runPiped,
  sequencePromises,
  toModuleFilePath,
  withTemporaryFolder,
} from "./help.ts";

import { mainModule, version } from "../build/template.ts";

type Flags =
  | {
    type: "Batch";
    value: Array<Flags>;
  }
  | {
    type: "Sequence";
    value: Array<Flags>;
  }
  | {
    type: "OneOf";
    value: { [key: string]: Flags | undefined };
  }
  | {
    type: "Log";
    value: LogFlags;
  }
  | {
    type: "Build";
    value: BuildFlags;
  }
  | {
    type: "Serve";
    value: ServeFlags;
  }
  | { type: "Test"; value: TestFlags };

export type DevelopmentFlags = {
  packageModuleSource: string;
};

export default async function (
  args: Array<string>,
  devFlags?: DevelopmentFlags,
) {
  const flags = await withTemporaryFolder(
    { prefix: "develm" },
    toReadFlags(devFlags),
  );
  await toRunFlags(args)(flags);
}
// Flags

function toReadFlags(devFlags?: DevelopmentFlags) {
  return async (tempDirPath: string): Promise<Flags> => {
    const flagsFilePath = await toModuleFilePath("Dev");
    await Promise.all([
      Deno.writeTextFile(`${tempDirPath}/RunMain.elm`, mainModule),
      Deno.writeTextFile(
        `${tempDirPath}/elm.json`,
        JSON.stringify(toElmJson(devFlags)),
      ),
      Deno.writeTextFile(
        `${tempDirPath}/Dev.elm`,
        await Deno.readTextFile(flagsFilePath),
      ),
    ]);

    if (devFlags) {
      await Deno.writeTextFile(
        `${tempDirPath}/DevElm.elm`,
        devFlags.packageModuleSource,
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

function toRunFlags(args: Array<string>) {
  return async (flags: Flags): Promise<void> => {
    switch (flags.type) {
      case "Batch":
        await Promise.all(flags.value.map(toRunFlags(args)));
        break;
      case "Sequence":
        await sequencePromises(
          flags.value.map((flags) => () => toRunFlags(args)(flags)),
          undefined,
        );
        break;
      case "OneOf":
        const flagsAtKey = flags.value[args[0]];
        if (flagsAtKey === undefined) {
          throw `I didn't recognize "${args[0]}". Did you mean one of these?: ${
            Object.keys(flags.value)
              .map((str) => `\n - ${str}`)
              .join("")
          }`;
        }
        await toRunFlags(args.slice(1))(flagsAtKey);
        break;

      case "Log":
        log(version, flags.value);
        break;
      case "Build":
        await build(flags.value);
        break;
      case "Serve":
        await serve(flags.value);
        break;

      case "Test":
        await test(flags.value);
        break;

      default:
        throw `unrecognized flags: ${JSON.stringify(flags)}`;
    }
  };
}

function toElmJson(devFlags?: DevelopmentFlags) {
  const direct: { [key: string]: string } = {
    "elm/core": "1.0.5",
    "elm/json": "1.1.3",
  };

  if (!devFlags) {
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
