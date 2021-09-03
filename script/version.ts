import { version } from "../src/main.ts";

export default async function throwIncompatible() {
  const binaryVersion: string = version.join(".");
  const packageVersion: string = JSON.parse(
    await Deno.readTextFile("elm.json")
  )["version"];
  if (binaryVersion !== packageVersion) {
    throw `Incompatible versions. 
The binary is <${binaryVersion}>
The package is >${packageVersion}>`;
  }
}

if (import.meta.main) await throwIncompatible();
