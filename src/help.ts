// Promises

export function sequencePromises<T>(
  promises: Array<(prev: T) => Promise<T>>,
  init: T,
): Promise<T> {
  return promises.reduce((prev, cur) => prev.then(cur), Promise.resolve(init));
}

// Processes

export async function runPiped(
  cmd: Array<string>,
  cwd?: string,
): Promise<string> {
  const process = Deno.run({
    cmd,
    stderr: "piped",
    stdout: "piped",
    cwd,
  });
  const status = await process.status();
  if (!status.success || status.code !== 0) {
    const stdErr = await process.stderrOutput();
    throw new TextDecoder().decode(stdErr);
  }
  return new TextDecoder().decode(await process.output());
}

// Directories

export async function withTemporaryFolder<output>(
  options: Deno.MakeTempOptions,
  callback: (tempDir: string) => Promise<output>,
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

export async function toModuleFilePath(moduleName: string): Promise<string> {
  const relativeModulePath = moduleName.replaceAll(".", "/") + ".elm";
  return Promise.any<string>(
    JSON.parse(await Deno.readTextFile("elm.json"))["source-directories"].map(
      async (srcDir: string) => {
        const moduleFilePath = `${srcDir}/${relativeModulePath}`;
        const { isFile } = await Deno.lstat(moduleFilePath);
        if (isFile) {
          return moduleFilePath;
        }
      },
    ),
  );
}

export async function ensureDirectoriesForFile(
  filePath: string,
): Promise<void> {
  return Deno.mkdir(filePath.split("/").slice(0, -1).join("/"), {
    recursive: true,
  });
}

// Color

export enum ANSI {
  Underline = 4,
  Red = 31,
  Green = 32,
  Yellow = 33,
  Blue = 34,
}

export function ansi(ansi: ANSI, text: string): string {
  return `\u{001B}[${ansi}m${text}\u{001B}[0m`;
}

// Numbers

export function randomInt() {
  return Math.floor(Math.random() * 4294967295);
}
