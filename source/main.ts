const elmJson = JSON.stringify({
  type: "application",
  "source-directories": ["."],
  "elm-version": "0.19.1",
  dependencies: {
    direct: {
      "elm/core": "1.0.5",
      "elm/json": "1.1.3",
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

port output : Json.Encode.Value -> Cmd msg
main : Program () () ()
main = Platform.worker 
  { init = always ((), run)
  , update = (always (always ((), Cmd.none)))
  , subscriptions = always Sub.none
  }

run = output (Json.Encode.string "Hello")
`;

export default async function (_: Array<string>) {
  const flags = await withTemporaryFolder({ prefix: "develm" }, readFlags);
  console.log({ flags });
  throw "TODO";
}

async function readFlags(tempDirPath: string): Promise<void> {
  const moduleFileName = `Main.elm`;
  const compiledFileName = `main.js`;
  await Deno.writeTextFile(`${tempDirPath}/${moduleFileName}`, elmModule);
  await Deno.writeTextFile(`${tempDirPath}/elm.json`, elmJson);
  await Deno.run({
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
