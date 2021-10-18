module DevElm exposing
    ( Flags, batch, sequence, oneOf
    , LogFlags, logVersion, logText
    , BuildFlags, defaultBuild, buildWith
    , ServeFlags, defaultServe, serveWith
    , TestFlags, defaultTest, testWith
    , BenchmarkFlags, defaultBenchmark, benchmarkWith
    , BuildFormat, esm, iife
    , BuildMode, develop, debug, optimize
    , toJson
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


# Internals

@docs toJson

-}

import Benchmark exposing (Benchmark)
import DevElm.Main
import Dict
import Json.Encode
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


{-| -}
toJson : Flags flags -> Json.Encode.Value
toJson =
    DevElm.Main.toJson


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
    { moduleName = "Main"
    , outputPath = Just "build/main.js"
    , format = DevElm.Main.ImmediatelyInvokedFunctionInvocation
    , mode = DevElm.Main.Develop
    }


{-| -}
buildWith : BuildFlags flags -> Flags flags
buildWith flags =
    DevElm.Main.Build flags


{-| -}
type alias ServeFlags flags =
    DevElm.Main.ServeFlags flags


{-| -}
defaultServe : ServeFlags {}
defaultServe =
    { moduleName = "Main"
    , hostName = "localhost"
    , portNumber = 8080
    , mode = DevElm.Main.Develop
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


{-| -}
serveWith : ServeFlags flags -> Flags flags
serveWith =
    DevElm.Main.Serve


{-| -}
type alias TestFlags flags =
    DevElm.Main.TestFlags flags


{-| -}
defaultTest : Test -> TestFlags {}
defaultTest test =
    { seed = Nothing
    , fuzz = 100
    , test = test
    }


{-| -}
testWith : TestFlags flags -> Flags flags
testWith =
    DevElm.Main.Test


{-| -}
type alias BenchmarkFlags flags =
    DevElm.Main.BenchmarkFlags flags


{-| -}
defaultBenchmark : Benchmark -> BenchmarkFlags {}
defaultBenchmark benchmark =
    { benchmark = benchmark
    }


{-| -}
benchmarkWith : BenchmarkFlags flags -> Flags flags
benchmarkWith =
    DevElm.Main.Benchmark


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
