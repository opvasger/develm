module DevElm exposing
    ( Flags, batch, sequence, oneOf
    , LogFlags, logVersion, logText
    , BuildFlags, defaultBuild, buildWith
    , ServeFlags, defaultServe, serveWith
    , TestFlags, defaultTest, testWith
    , BenchmarkFlags, defaultBenchmark, benchmarkWith
    , BuildFormat, esm, iife
    , BuildMode, develop, debug, optimize
    )

{-|


# Flags

@docs Flags, batch, sequence, oneOf


# Logging

@docs LogFlags, logVersion, logText


# Builds

@docs BuildFlags, defaultBuild, buildWith


# Development Server

@docs ServeFlags, defaultServe, serveWith


# Testing

@docs TestFlags, defaultTest, testWith


# Benchmarking

@docs BenchmarkFlags, defaultBenchmark, benchmarkWith


# Build Formats

@docs BuildFormat, esm, iife


# Build Modes

@docs BuildMode, develop, debug, optimize

-}

import Benchmark exposing (Benchmark)
import DevElm.Main
import Dict
import Test exposing (Test)


type alias Flags flags =
    DevElm.Main.Flags flags


{-| -}
batch : List (Flags flags) -> Flags flags
batch =
    DevElm.Main.Batch


{-| -}
sequence : List (Flags flags) -> Flags flags
sequence =
    DevElm.Main.Sequence


{-| -}
oneOf : List ( String, Flags flags ) -> Flags flags
oneOf =
    DevElm.Main.OneOf


type alias LogFlags =
    DevElm.Main.LogFlags


{-| -}
logText : String -> Flags flags
logText =
    DevElm.Main.Log << DevElm.Main.Text


{-| -}
logVersion : Flags flags
logVersion =
    DevElm.Main.Log DevElm.Main.Version


{-| -}
type alias BuildFlags flags =
    DevElm.Main.BuildFlags flags


{-| -}
defaultBuild : BuildFlags {}
defaultBuild =
    { outputPath = Just "build/main.js"
    , format = DevElm.Main.ImmediatelyInvokedFunctionInvocation
    , mode = DevElm.Main.Develop
    }


{-| -}
buildWith : BuildFlags flags -> Program programFlags model msg -> Flags flags
buildWith flags program =
    DevElm.Main.Build flags


{-| -}
type alias ServeFlags flags =
    DevElm.Main.ServeFlags flags


{-| -}
defaultServe : ServeFlags {}
defaultServe =
    { outputPath = "build/main.js"
    , format = DevElm.Main.ImmediatelyInvokedFunctionInvocation
    , mode = DevElm.Main.Develop
    , hostName = "localhost"
    , portNumber = 8080
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


{-| -}
serveWith : ServeFlags flags -> Program programFlags model msg -> Flags flags
serveWith flags program =
    DevElm.Main.Serve flags


{-| -}
type alias TestFlags flags =
    DevElm.Main.TestFlags flags


{-| -}
defaultTest : TestFlags {}
defaultTest =
    { seed = Nothing
    , fuzz = 100
    }


{-| -}
testWith : TestFlags flags -> Test -> Flags flags
testWith flags test =
    DevElm.Main.Test flags


{-| -}
type alias BenchmarkFlags flags =
    DevElm.Main.BenchmarkFlags flags


{-| -}
defaultBenchmark : BenchmarkFlags {}
defaultBenchmark =
    {}


{-| -}
benchmarkWith : BenchmarkFlags flags -> Benchmark -> Flags flags
benchmarkWith flags benchmark =
    DevElm.Main.Benchmark flags


{-| -}
type alias BuildFormat =
    DevElm.Main.BuildFormat


{-| -}
iife : BuildFormat
iife =
    DevElm.Main.ImmediatelyInvokedFunctionInvocation


{-| -}
esm : BuildFormat
esm =
    DevElm.Main.EcmaScriptModule


{-| -}
type alias BuildMode =
    DevElm.Main.BuildMode


{-| -}
develop : BuildMode
develop =
    DevElm.Main.Develop


{-| -}
debug : BuildMode
debug =
    DevElm.Main.Debug


{-| -}
optimize : BuildMode
optimize =
    DevElm.Main.Optimize
