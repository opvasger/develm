export function sequencePromises<T>(
  promises: Array<(prev: T) => Promise<T>>,
  init: T
): Promise<T> {
  return promises.reduce((prev, cur) => prev.then(cur), Promise.resolve(init));
}

export async function withTemporaryFolder<output>(
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

export async function runPiped(
  cmd: Array<string>,
  cwd?: string
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
