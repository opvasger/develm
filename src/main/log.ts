export type LogConfiguration =
  | { type: "Text"; value: string }
  | { type: "Version"; value: null };

export default function (
  version: [number, number, number],
  config: LogConfiguration
) {
  switch (config.type) {
    case "Text":
      return console.log(config.value);
    case "Version":
      return console.log(version.join("."));
  }
}
