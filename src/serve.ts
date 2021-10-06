import { serve } from "https://deno.land/std@0.106.0/http/mod.ts";

import build from "./build.ts";

export type ServeFlags = {
  moduleName: string;
  hostname: string;
  port: number;
  mode: "develop" | "debug";
  outputPath: string;
  documentPath: string | null;
  headers: { [key: string]: string };
  contentTypes: { [key: string]: string };
};

export default async function (flags: ServeFlags) {
  for await (const request of serve(flags)) {
    let error = null;
    if (request.url === "/") {
      if (flags.documentPath) request.url = `/${flags.documentPath}`;
      error = await build({
        format: "iife",
        mode: flags.mode,
        moduleName: flags.moduleName,
        outputPath: flags.outputPath,
      }).catch((error) => error);
    }

    const result = error
      ? {
        status: 400,
        body: toErrorHtml(error),
        headers: new Headers({
          ...flags.headers,
          "content-type": "text/html",
        }),
      }
      : await Deno.readFile(request.url.slice(1))
        .then((body) => ({
          status: 200,
          body,
          headers: new Headers({
            ...flags.headers,
            "content-type": flags.contentTypes[
              Object.keys(flags.contentTypes).find((
                extension,
              ) => request.url.endsWith(`.${extension}`)) || ""
            ],
          }),
        }))
        .catch((error) =>
          request.url === "/" && flags.documentPath === null
            ? {
              status: 200,
              body: toProgramHtml(flags.outputPath, flags.moduleName),
              headers: new Headers({
                ...flags.headers,
                "content-type": "text/html",
              }),
            }
            : {
              status: 404,
              body: JSON.stringify(error),
              headers: new Headers(flags.headers),
            }
        );

    await request.respond(result);
  }
}

function toErrorHtml(error: string) {
  return `<html>
  <style>
    body {
        white-space:break-spaces;
        background-color: #0c91d8;
        font-family: monospace;
        color: white;
    }
  </style>
  <body>${
    error
      .split("<")
      .map((segment) => {
        if (segment.startsWith("https") && segment.includes(">")) {
          return segment
            .split(">")
            .map((innerSegment, index) => {
              if (index === 0) {
                return `<a style="color:white;" target="blank" href="${innerSegment}">${innerSegment}</a>`;
              }
              return innerSegment;
            })
            .join(">");
        }
        return segment;
      })
      .join("<")
  }</body>
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
