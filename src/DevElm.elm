module DevElm exposing
    ( Configuration(..)
    , LogConfiguration(..)
    , BuildConfiguration, Format(..), Mode(..), defaultBuild
    , encodeConfiguration
    , doNothing
    )

{-|

@docs Configuration

@docs LogConfiguration

@docs BuildConfiguration, Format, Mode, defaultBuild


## Internals

These definitions are for program-authors who want to consume the configuration for their own programs.

@docs encodeConfiguration


## Deprecated

These definitions are removed in the next major version.

@docs doNothing

-}

import Dict
import Json.Encode


{-| Configuration for the `develm` program.
-}
type Configuration
    = Log LogConfiguration
    | Build BuildConfiguration
    | Batch (List Configuration)
    | Sequence (List Configuration)
    | OneOf (List ( String, Configuration ))


{-| Encode a configuration as JSON.
-}
encodeConfiguration : Configuration -> Json.Encode.Value
encodeConfiguration config =
    let
        ( type_, value ) =
            case config of
                Log logConfig ->
                    ( "Log", encodeLogConfiguration logConfig )

                Build buildConfig ->
                    ( "Build", encodeBuildConfiguration buildConfig )

                Batch configs ->
                    ( "Batch", Json.Encode.list encodeConfiguration configs )

                Sequence configs ->
                    ( "Sequence", Json.Encode.list encodeConfiguration configs )

                OneOf pairs ->
                    ( "OneOf", Json.Encode.dict identity encodeConfiguration (Dict.fromList pairs) )
    in
    Json.Encode.object
        [ ( "type", Json.Encode.string type_ )
        , ( "value", value )
        ]



-- Log


{-| Log text messages to the console.
-}
type LogConfiguration
    = Text String
    | Version


encodeLogConfiguration : LogConfiguration -> Json.Encode.Value
encodeLogConfiguration config =
    let
        ( type_, value ) =
            case config of
                Text text ->
                    ( "Text", Json.Encode.string text )

                Version ->
                    ( "Version", Json.Encode.null )
    in
    Json.Encode.object
        [ ( "type", Json.Encode.string type_ )
        , ( "value", value )
        ]



-- Build


{-| Configure DevElm to build an elm program.
-}
type alias BuildConfiguration =
    { moduleName : String
    , outputPath : Maybe String
    , format : Format
    , mode : Mode
    }


encodeBuildConfiguration : BuildConfiguration -> Json.Encode.Value
encodeBuildConfiguration { moduleName, outputPath, format, mode } =
    Json.Encode.object
        [ ( "moduleName", Json.Encode.string moduleName )
        , ( "outputPath"
          , Maybe.withDefault Json.Encode.null
                (Maybe.map Json.Encode.string outputPath)
          )
        , ( "format", encodeFormat format )
        , ( "mode", encodeMode mode )
        ]


{-| Configure what format the program should be built to.

  - `EcmaScriptModule` allows for native JavaScript-module imports.
  - `ImmediatelyInvokedFunctionInvocation` exposes the `Elm` global along with a Node-compatible module.

-}
type Format
    = ImmediatelyInvokedFunctionInvocation
    | EcmaScriptModule


encodeFormat : Format -> Json.Encode.Value
encodeFormat format =
    case format of
        ImmediatelyInvokedFunctionInvocation ->
            Json.Encode.string "iife"

        EcmaScriptModule ->
            Json.Encode.string "esm"


{-| Configure what mode the program should be built in.

  - `Develop` is a development-build
  - `Debug` is a development-build that includes the time-travelling debugger
  - `Optimize` is a production-build that includes minification

-}
type Mode
    = Develop
    | Debug
    | Optimize


encodeMode : Mode -> Json.Encode.Value
encodeMode mode =
    case mode of
        Develop ->
            Json.Encode.string "develop"

        Debug ->
            Json.Encode.string "debug"

        Optimize ->
            Json.Encode.string "optimize"


{-| The default-configuration for building Elm programs
-}
defaultBuild : BuildConfiguration
defaultBuild =
    { moduleName = "Main"
    , outputPath = Just "build/main.js"
    , format = ImmediatelyInvokedFunctionInvocation
    , mode = Develop
    }


{-| A configuration that does nothing at all.
-}
doNothing : Configuration
doNothing =
    Log (Text "")
