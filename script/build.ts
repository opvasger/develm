import { gzip } from "https://deno.land/x/denoflate@1.2.1/mod.ts";

import { runPiped, sequencePromises } from "../src/help.ts";
import buildTemplate from "./template.ts";

if (import.meta.main) {
  const buildFor: Array<Target> = [
    "x86_64-pc-windows-msvc",
    "x86_64-unknown-linux-gnu",
  ];
  await Deno.mkdir("build", { recursive: true });
  await buildTemplate();
  await sequencePromises(
    buildFor.map((platform) => () => buildBinary(platform)),
    undefined,
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
      undefined,
    ),
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
