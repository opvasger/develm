const elmJson = JSON.stringify({
  type: "application",
  "source-directories": ["."],
  "elm-version": "0.19.1",
  dependencies: {
    direct: {
      "elm/core": "1.0.5",
      "elm/json": "1.1.3",
      "opvasger/develm": "1.0.0",
    },
    indirect: {},
  },
  "test-dependencies": {
    direct: {},
    indirect: {},
  },
});

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

export default async function (_: Array<string>) {
  const flags = await withTemporaryFolder({ prefix: "develm" }, readFlags);
  throw JSON.stringify(flags);
}

async function readFlags(tempDirPath: string): Promise<void> {
  const moduleFileName = "Main.elm";
  const compiledFileName = "main.js";
  const configFileName = "Dev.elm";
  await Deno.writeTextFile(`${tempDirPath}/${moduleFileName}`, elmModule);
  await Deno.writeTextFile(`${tempDirPath}/elm.json`, elmJson);
  await Deno.writeTextFile(
    `${tempDirPath}/${configFileName}`,
    await Deno.readTextFile(configFileName)
  );
  const error = await Deno.run({
    cmd: [
      "elm",
      "make",
      "--optimize",
      `--output=${compiledFileName}`,
      moduleFileName,
    ],
    cwd: tempDirPath,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).stderrOutput();

  console.log(new TextDecoder().decode(error));

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
}

async function withTemporaryFolder<output>(
  options: Deno.MakeTempOptions,
  callback: (tempDir: string) => Promise<output>
): Promise<output> {
  async function removeTempDir() {
    await Deno.remove(tempDir, { recursive: true });
  }
  const tempDir = await Deno.makeTempDir(options);
  const result = await callback(tempDir).catch(async function (error) {
    await removeTempDir();
    throw error;
  });
  await removeTempDir();
  return result;
}
