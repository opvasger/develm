import { gzip } from "https://deno.land/x/denoflate@1.2.1/mod.ts";

import throwIncompatible from "./version.ts";
import { sequencePromises, runPiped } from "../src/help.ts";

if (import.meta.main) {
  await throwIncompatible();
  const buildFor: Array<Target> = ["x86_64-pc-windows-msvc"];
  await Deno.mkdir("build", { recursive: true });
  await sequencePromises(
    buildFor.map((platform) => () => buildBinary(platform)),
    undefined
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
