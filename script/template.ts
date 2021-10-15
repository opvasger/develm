if (import.meta.main) await buildTemplate();

export default async function buildTemplate() {
  console.log("\nbuilding template-module");
  const mainModule = await Deno.readTextFile("src/RunMain.elm");
  const testModule = await Deno.readTextFile("src/RunTest.elm");
  const benchmarkModule = await Deno.readTextFile("src/RunBenchmark.elm");
  const elmJson = JSON.parse(await Deno.readTextFile("elm.json"));
  const mainElmJson = JSON.parse(await Deno.readTextFile("main.elm.json"));

  Deno.writeTextFile(
    "build/template.ts",
    `export const elmJson = ${JSON.stringify(elmJson)}
  export const mainElmJson = ${JSON.stringify(mainElmJson)}
  export const mainModule : string = \`${mainModule.replaceAll("\\", "\\\\")}\`
  export const testModule : string = \`${testModule.replaceAll("\\", "\\\\")}\`
  export const benchmarkModule : string = \`${
      benchmarkModule.replaceAll("\\", "\\\\")
    }\`
    `,
  );
}
