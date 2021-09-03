import { serve, Response } from "https://deno.land/std@0.106.0/http/mod.ts";

import build from "./build.ts";

export type ServeConfiguration = {
  moduleName: string;
  hostname: string;
  port: number;
  mode: "develop" | "debug";
  outputPath: string;
  documentPath: string | null;
  headers: { [key: string]: string };
  contentTypes: { [key: string]: string };
};

export default async function (config: ServeConfiguration) {
  for await (const request of serve(config)) {
    const response: Response = {
      status: 404,
      body: undefined,
      headers: new Headers(config.headers),
    };
    try {
      if (request.url == "/") {
        const startedAt = performance.now();
        await build({
          format: "iife",
          mode: config.mode,
          moduleName: config.moduleName,
          outputPath: config.outputPath,
        });
        const endedAt = performance.now();
        console.log(`rebuilt in ${(endedAt - startedAt) / 1000} seconds`);
      }

      response.body = await Deno.readFile(request.url.slice(1));
      response.status = 200;
      Object.entries(config.contentTypes).some(([key, value]) => {
        const isType = request.url.endsWith(`.${key}`);
        if (isType) response.headers?.set("content-type", value);
        return isType;
      });
    } catch (error) {
      response.body =
        typeof error === "string"
          ? toErrorHtml(error)
          : config.documentPath
          ? await Deno.readFile(config.documentPath)
          : await (async () => {
              await build({
                format: "iife",
                mode: config.mode,
                moduleName: config.moduleName,
                outputPath: config.outputPath,
              });
              const output = await Deno.readTextFile(config.outputPath);
              return toProgramHtml(output, config.moduleName);
            })();
      response.headers?.set("content-type", config.contentTypes["html"]);
      response.status = 200;
    }

    request.respond(response);
  }
}

function toErrorHtml(error: string) {
  return `<html>
  <style>
    body {
        white-space:pre;
        background-color: #0c91d8;
        font-family: monospace;
        color: white;
    }
  </style>
  <body>
    ${error}
  </body>
</html>
`;
}

function toProgramHtml(compiled: string, moduleName: string) {
  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Application</title>
      </head>
      <body>
         <script>
            ${compiled}
            Elm.${moduleName}.init({flags:window,node:document.body});
          </script>
      </body>
    </html>`;
}
