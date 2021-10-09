export type LogFlags =
  | { type: "Text"; value: string }
  | { type: "Version"; value: null };

export default function (
  version: [number, number, number],
  flags: LogFlags,
) {
  switch (flags.type) {
    case "Text":
      return console.log(flags.value);
    case "Version":
      return console.log(version.join("."));
  }
}
