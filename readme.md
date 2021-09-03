# DevElm

Develop Elm programs with ease!

## Setup

DevElm is released as a [binary](https://github.com/opvasger/develm/releases) and [module](https://deno.land/x/develm) for [deno](https://deno.land/#installation).

DevElm relies on [elm](https://github.com/elm/compiler/releases) being installed and available.

Documentation is available on the [elm-package](https://package.elm-lang.org/packages/opvasger/develm/latest) website.

## Usage

1. run `elm install opvasger/develm` to install the configuration-package.
2. Make a `Dev.elm` in the same directory as the projects `elm.json`. It should import `DevElm` and expose a `config` of type `Configuration` - for example like this:

```elm
module Dev exposing (config)

import DevElm exposing (defaultBuild)

config : DevElm.Configuration
config =
    DevElm.Build { defaultBuild | mode = DevElm.Optimize }
```

3. run `develm` or `deno run https://deno.land/x/develm/mod.ts` to perform configured task(s).
