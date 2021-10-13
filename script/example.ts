import main from "../src/main.ts";

/** run an example like this:

deno run -A script/template.ts
cd example/benchmark/
deno run -A ../../script/example.ts
cd ../../

 */
await main(Deno.args, {
  packageModuleSource: await Deno.readTextFile("../../src/DevElm.elm"),
});
