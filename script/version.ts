import { version } from "../src/main.ts";

export default async function throwIncompatible() {
  const binaryVersion = version;
  const packageVersion: [number, number, number] = JSON.parse(
    await Deno.readTextFile("elm.json")
  )
    ["version"].split(".")
    .map((text: string) => parseInt(text));

  if (
    binaryVersion[0] !== packageVersion[0] ||
    packageVersion[1] > binaryVersion[1]
  ) {
    throw `Incompatible versions. 
The binary is <${binaryVersion}>
The package is >${packageVersion}>`;
  }
}

if (import.meta.main) await throwIncompatible();
