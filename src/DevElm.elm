module DevElm exposing
    ( Configuration
    , encodeConfiguration
    )

{-|

@docs Configuration

@docs encodeConfiguration

-}

import Json.Encode


{-| A valid configuration for the develm-program. The readme has more details on it's usage.
-}
type Configuration
    = Configuration {}


{-| This function is used internally by the binary or deno-module. It simply encodes the configuration is JSON-format.
-}
encodeConfiguration : Configuration -> Json.Encode.Value
encodeConfiguration (Configuration _) =
    Json.Encode.string "this release has no features yet!"
