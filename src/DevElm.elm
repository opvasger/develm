module DevElm exposing
    ( Configuration(..)
    , LogConfiguration(..)
    , BuildConfiguration, Format(..), Mode(..), defaultBuild
    , ServeConfiguration, defaultServe
    , encodeConfiguration
    )

{-|

@docs Configuration

@docs LogConfiguration

@docs BuildConfiguration, Format, Mode, defaultBuild

@docs ServeConfiguration, defaultServe


## Internals

These definitions are for program-authors who want to consume the configuration for their own programs.

@docs encodeConfiguration

-}

import Dict exposing (Dict)
import Json.Encode


{-| Configuration for the `develm` program.

  - `Batch` performs tasks unordered.
  - `Sequence` performs tasks sequentially.
  - `OneOf` performs tasks optionally - `OneOf [("build", Build defaultBuild)]` is performed with `develm build`.

-}
type Configuration
    = Log LogConfiguration
    | Build BuildConfiguration
    | Serve ServeConfiguration
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

                Serve serveConfig ->
                    ( "Serve", encodeServeConfiguration serveConfig )

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


{-| The default-configuration for building Elm programs. It makes an unoptimized build of a module named `Main` into `build/main.js`
-}
defaultBuild : BuildConfiguration
defaultBuild =
    { moduleName = defaultServe.moduleName
    , outputPath = Just defaultServe.outputPath
    , format = ImmediatelyInvokedFunctionInvocation
    , mode = defaultServe.mode
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

  - `Develop` is a development-build.
  - `Debug` is a development-build that includes the time-travelling debugger.
  - `Optimize` is a production-build that includes minification.

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



-- Serve


{-| Configure DevElm to build an elm program.
-}
type alias ServeConfiguration =
    { moduleName : String
    , hostname : String
    , port_ : Int
    , mode : Mode
    , outputPath : String
    , documentPath : Maybe String
    , contentTypes : Dict String String
    , headers : Dict String String
    }


{-| The default-configuration for serving Elm programs. It assumes no HTML-document is present.
-}
defaultServe : ServeConfiguration
defaultServe =
    { moduleName = "Main"
    , hostname = "localhost"
    , port_ = 8080
    , mode = Develop
    , outputPath = "build/main.js"
    , documentPath = Nothing
    , headers = Dict.empty
    , contentTypes =
        Dict.fromList
            [ ( "html", "text/html" )
            , ( "js", "text/javascript" )
            , ( "json", "application/json" )
            , ( "woff", "font/woff" )
            , ( "png", "image/png" )
            , ( "txt", "text/plain" )
            , ( "svg", "image/svg+xml" )
            ]
    }


encodeServeConfiguration : ServeConfiguration -> Json.Encode.Value
encodeServeConfiguration { moduleName, hostname, port_, mode, outputPath, documentPath, contentTypes, headers } =
    Json.Encode.object
        [ ( "moduleName", Json.Encode.string moduleName )
        , ( "hostname", Json.Encode.string hostname )
        , ( "port", Json.Encode.int port_ )
        , ( "mode", encodeMode mode )
        , ( "outputPath", Json.Encode.string outputPath )
        , ( "documentPath", Maybe.withDefault Json.Encode.null (Maybe.map Json.Encode.string documentPath) )
        , ( "contentTypes", Json.Encode.dict identity Json.Encode.string contentTypes )
        , ( "headers", Json.Encode.dict identity Json.Encode.string headers )
        ]
