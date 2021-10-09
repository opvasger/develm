module DevElm exposing
    ( Flags(..)
    , LogFlags(..)
    , BuildFlags, Format(..), Mode(..), defaultBuild
    , ServeFlags, defaultServe
    , TestFlags, defaultTest
    , encodeFlags
    )

{-|

@docs Flags

@docs LogFlags

@docs BuildFlags, Format, Mode, defaultBuild

@docs ServeFlags, defaultServe

@docs TestFlags, defaultTest


## Internals

These definitions are for program-authors who want to consume the Flags for their own programs.

@docs encodeFlags

-}

import Dict exposing (Dict)
import Json.Encode


{-| Flags for the `develm` program.

  - `Batch` performs tasks unordered.
  - `Sequence` performs tasks sequentially.
  - `OneOf` performs tasks optionally - `OneOf [("build", Build defaultBuild)]` is performed with `develm build`.

-}
type Flags
    = Batch (List Flags)
    | Sequence (List Flags)
    | OneOf (List ( String, Flags ))
    | Log LogFlags
    | Build BuildFlags
    | Serve ServeFlags
    | Test TestFlags


{-| Encode a Flags as JSON.
-}
encodeFlags : Flags -> Json.Encode.Value
encodeFlags flags =
    let
        ( type_, value ) =
            case flags of
                Batch subFlags ->
                    ( "Batch", Json.Encode.list encodeFlags subFlags )

                Sequence subFlags ->
                    ( "Sequence", Json.Encode.list encodeFlags subFlags )

                OneOf pairs ->
                    ( "OneOf", Json.Encode.dict identity encodeFlags (Dict.fromList pairs) )

                Log logflags ->
                    ( "Log", encodeLogFlags logflags )

                Build buildflags ->
                    ( "Build", encodeBuildFlags buildflags )

                Serve serveflags ->
                    ( "Serve", encodeServeFlags serveflags )

                Test testflags ->
                    ( "Test", encodeTestFlags testflags )
    in
    Json.Encode.object
        [ ( "type", Json.Encode.string type_ )
        , ( "value", value )
        ]



-- Log


{-| Log text messages to the console.
-}
type LogFlags
    = Text String
    | Version


encodeLogFlags : LogFlags -> Json.Encode.Value
encodeLogFlags flags =
    let
        ( type_, value ) =
            case flags of
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


{-| Flag DevElm to build an elm program.
-}
type alias BuildFlags =
    { moduleName : String
    , outputPath : Maybe String
    , format : Format
    , mode : Mode
    }


{-| The default-Flags for building Elm programs. It makes an unoptimized build of a module named `Main` into `build/main.js`
-}
defaultBuild : BuildFlags
defaultBuild =
    { moduleName = defaultServe.moduleName
    , outputPath = Just defaultServe.outputPath
    , format = ImmediatelyInvokedFunctionInvocation
    , mode = defaultServe.mode
    }


encodeBuildFlags : BuildFlags -> Json.Encode.Value
encodeBuildFlags { moduleName, outputPath, format, mode } =
    Json.Encode.object
        [ ( "moduleName", Json.Encode.string moduleName )
        , ( "outputPath"
          , Maybe.withDefault Json.Encode.null
                (Maybe.map Json.Encode.string outputPath)
          )
        , ( "format", encodeFormat format )
        , ( "mode", encodeMode mode )
        ]


{-| Flag what format the program should be built to.

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


{-| Flag what mode the program should be built in.

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


{-| Flag DevElm to serve an elm program over HTTP.
-}
type alias ServeFlags =
    { moduleName : String
    , hostname : String
    , port_ : Int
    , mode : Mode
    , outputPath : String
    , documentPath : Maybe String
    , contentTypes : Dict String String
    , headers : Dict String String
    }


{-| The default-Flags for serving Elm programs. It assumes no HTML-document is present.
-}
defaultServe : ServeFlags
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


encodeServeFlags : ServeFlags -> Json.Encode.Value
encodeServeFlags { moduleName, hostname, port_, mode, outputPath, documentPath, contentTypes, headers } =
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



-- Test


{-| Flag DevElm to test Elm functions.
-}
type alias TestFlags =
    { seed : Maybe Int
    , fuzz : Int
    , moduleName : String
    , testName : String
    }


encodeTestFlags : TestFlags -> Json.Encode.Value
encodeTestFlags { seed, fuzz, moduleName, testName } =
    Json.Encode.object
        [ ( "seed", Maybe.withDefault Json.Encode.null (Maybe.map Json.Encode.int seed) )
        , ( "fuzz", Json.Encode.int fuzz )
        , ( "moduleName", Json.Encode.string moduleName )
        , ( "testName", Json.Encode.string testName )
        ]


{-| The default-Flags for testing Elm functions.
-}
defaultTest : TestFlags
defaultTest =
    { seed = Nothing
    , fuzz = 100
    , moduleName = "Main"
    , testName = "suite"
    }
