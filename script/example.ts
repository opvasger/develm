import main from "../src/main.ts";

await main(Deno.args, {
  packageModuleSource: await Deno.readTextFile("../../src/DevElm.elm"),
});
