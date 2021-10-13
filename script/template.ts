if (import.meta.main) await buildTemplate();

export default async function buildTemplate() {
  console.log("\nbuilding template-module");
  const mainModule = await Deno.readTextFile("src/RunMain.elm");
  const testModule = await Deno.readTextFile("src/RunTest.elm");
  const benchmarkModule = await Deno.readTextFile("src/RunBenchmark.elm");
  const version = JSON.parse(await Deno.readTextFile("elm.json"))
    .version.split(".")
    .map((n: string) => parseInt(n));

  Deno.writeTextFile(
    "build/template.ts",
    `export const version : [number,number,number] = ${JSON.stringify(version)}
  export const mainModule : string = \`${mainModule.replaceAll("\\", "\\\\")}\`
  export const testModule : string = \`${testModule.replaceAll("\\", "\\\\")}\`
  export const benchmarkModule : string = \`${
      benchmarkModule.replaceAll("\\", "\\\\")
    }\`
    `,
  );
}
