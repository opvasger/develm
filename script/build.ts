import { gzip } from "https://deno.land/x/denoflate@1.2.1/mod.ts";

import { sequencePromises, runPiped } from "../src/help.ts";

if (import.meta.main) {
  const buildFor: Array<Target> = ["x86_64-pc-windows-msvc"];
  await Deno.mkdir("build", { recursive: true });
  await buildTemplate();
  await sequencePromises(
    buildFor.map((platform) => () => buildBinary(platform)),
    undefined
  );
}

export async function buildTemplate() {
  console.log("\nbuilding template-module");
  const elmModule = await Deno.readTextFile("template/Main.elm");
  const version = JSON.parse(await Deno.readTextFile("elm.json"))
    .version.split(".")
    .map((n: string) => parseInt(n));

  Deno.writeTextFile(
    "build/template.ts",
    `export const version : [number,number,number] = ${JSON.stringify(version)}
export const elmModule : string = \`${elmModule}\`
  `
  );
}

export async function buildBinary(target: Target): Promise<void> {
  console.log(`\nbuilding binaries for ${target}`);
  await runPiped([
    "deno",
    "compile",
    "--allow-all",
    "--target",
    target,
    "--output",
    `build/develm`,
    "mod.ts",
  ]);

  await Deno.writeFile(
    `build/develm_${target}.gz`,
    gzip(
      await Deno.readFile("build/develm" + toTargetExtension(target)),
      undefined
    )
  );

  await Deno.remove("build/develm" + toTargetExtension(target));
}

// Target

type Target =
  | "x86_64-unknown-linux-gnu"
  | "x86_64-apple-darwin"
  | "x86_64-pc-windows-msvc";

function toTargetExtension(target: Target): string {
  if (target === "x86_64-pc-windows-msvc") return ".exe";
  return "";
}
