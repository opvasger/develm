import { serve } from "https://deno.land/std@0.106.0/http/mod.ts";

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
    let error = null;
    if (request.url === "/") {
      if (config.documentPath) request.url = `/${config.documentPath}`;
      error = await build({
        format: "iife",
        mode: config.mode,
        moduleName: config.moduleName,
        outputPath: config.outputPath,
      }).catch((error) => error);
    }

    const result = error
      ? {
          status: 400,
          body: toErrorHtml(error),
          headers: new Headers(config.headers),
        }
      : await Deno.readFile(request.url.slice(1))
          .then((body) => ({
            status: 200,
            body,
            headers: new Headers(config.headers),
          }))
          .catch((error) =>
            request.url === "/" && config.documentPath === null
              ? {
                  status: 200,
                  body: toProgramHtml(config.outputPath, config.moduleName),
                  headers: new Headers(config.headers),
                }
              : {
                  status: 404,
                  body: JSON.stringify(error),
                  headers: new Headers(config.headers),
                }
          );

    await request.respond(result);
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

function toProgramHtml(outputPath: string, moduleName: string) {
  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DevElm | ${moduleName}</title>
      </head>
      <body>
        <script src="${outputPath}"></script>
         <script>
            Elm.${moduleName}.init({flags:window,node:document.body});
          </script>
      </body>
    </html>`;
}
