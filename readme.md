# DevElm

Test, benchmark, and build Elm-modules!

## Setup

DevElm is available as a [binary](https://github.com/opvasger/develm/releases)
or [module](https://deno.land/x/develm) for
[deno](https://deno.land/#installation).

DevElm relies on [elm](https://github.com/elm/compiler/releases) being installed
and available.

Documentation is available on the
[elm-package](https://package.elm-lang.org/packages/opvasger/develm/latest)
website.

## Usage

1. run `elm install opvasger/develm` to install the flags-package.
2. as a temporary caveat, move the following packages from indirect- to
   direct-dependencies:
   - `BrianHicks/elm-trend`
   - `elm-explorations/test`
   - `elm-explorations/benchmark`
   - `elm/random`
3. create a `Dev.elm` module in a source-directory. It should import `DevElm`
   and expose a `flags`-definition of type `DevElm.Flags` - for example like
   this:

```elm
module Dev exposing (flags)

import DevElm exposing (defaultBuild)

flags : DevElm.Flags
flags =
    DevElm.Build { defaultBuild | mode = DevElm.Optimize }
```

3. run `develm` or `deno run https://deno.land/x/develm/mod.ts` to perform
   flagged task(s).
