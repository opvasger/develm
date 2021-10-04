export type TestConfiguration = {
  seed: number | null;
  fuzz: number;
};

export default async function (config: TestConfiguration) {
  console.log(config);
  throw "TODO";
}
