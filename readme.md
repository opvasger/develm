# DevElm

Develop Elm programs with ease!

## Usage

DevElm is available as [binary releases](https://github.com/opvasger/develm/releases), or using Deno, which can be installed very easily [like this](https://deno.land/#installation).

DevElm relies on the [Elm-compiler](https://github.com/elm/compiler/releases) being installed and available.

1. Make a `Dev.elm` module in a source-directory
2. install `opvasger/develm`
3. expose a `config` of type `DevElm.Configuration` from `Dev.elm`
4. run `develm` in that source-directory

Usage from the terminal should be straight-forward:

```bash
# using the binary
develm

# using deno
deno run https://deno.land/x/develm/mod.ts
```
