module DevElm.Main exposing
    ( BenchmarkFlags
    , BuildFlags
    , BuildFormat(..)
    , BuildMode(..)
    , Flags(..)
    , LogFlags(..)
    , ServeFlags
    , TestFlags
    , toJson
    )

import Benchmark exposing (Benchmark)
import Dict exposing (Dict)
import Json.Encode
import Test exposing (Test)


type Flags flags
    = Batch (List (Flags flags))
    | Sequence (List (Flags flags))
    | OneOf (List ( String, Flags flags ))
    | Log LogFlags
    | Build (BuildFlags flags)
    | Serve (ServeFlags flags)
    | Test (TestFlags flags)
    | Benchmark (BenchmarkFlags flags)


toJson : Flags flags -> Json.Encode.Value
toJson flags =
    let
        ( type_, value ) =
            case flags of
                Batch subFlags ->
                    ( "Batch", Json.Encode.list toJson subFlags )

                Sequence subFlags ->
                    ( "Sequence", Json.Encode.list toJson subFlags )

                OneOf pairs ->
                    ( "OneOf", Json.Encode.dict identity toJson (Dict.fromList pairs) )

                Log logflags ->
                    ( "Log", logFlagsToJson logflags )

                Build buildflags ->
                    ( "Build", buildFlagsToJson buildflags )

                Serve serveflags ->
                    ( "Serve", serveFlagsToJson serveflags )

                Test testflags ->
                    ( "Test", testFlagsToJson testflags )

                Benchmark benchmarkflags ->
                    ( "Benchmark", benchmarkFlagsToJson benchmarkflags )
    in
    Json.Encode.object
        [ ( "type", Json.Encode.string type_ )
        , ( "value", value )
        ]


type LogFlags
    = Text String
    | Version


logFlagsToJson : LogFlags -> Json.Encode.Value
logFlagsToJson flags =
    let
        ( type_, value ) =
            case flags of
                Text text_ ->
                    ( "Text", Json.Encode.string text_ )

                Version ->
                    ( "Version", Json.Encode.null )
    in
    Json.Encode.object
        [ ( "type", Json.Encode.string type_ )
        , ( "value", value )
        ]


type alias BuildFlags flags =
    { flags
        | moduleName : String
        , outputPath : Maybe String
        , format : BuildFormat
        , mode : BuildMode
    }


buildFlagsToJson : BuildFlags flags -> Json.Encode.Value
buildFlagsToJson { moduleName, outputPath, format, mode } =
    Json.Encode.object
        [ ( "moduleName", Json.Encode.string moduleName )
        , ( "outputPath"
          , Maybe.withDefault Json.Encode.null
                (Maybe.map Json.Encode.string outputPath)
          )
        , ( "format", formatToJson format )
        , ( "mode", modeToJson mode )
        ]


type alias ServeFlags flags =
    { flags
        | moduleName : String
        , hostName : String
        , portNumber : Int
        , mode : BuildMode
        , outputPath : String
        , documentPath : Maybe String
        , contentTypes : Dict String String
        , headers : Dict String String
    }


serveFlagsToJson : ServeFlags flags -> Json.Encode.Value
serveFlagsToJson { moduleName, hostName, portNumber, mode, outputPath, documentPath, contentTypes, headers } =
    Json.Encode.object
        [ ( "moduleName", Json.Encode.string moduleName )
        , ( "hostname", Json.Encode.string hostName )
        , ( "port", Json.Encode.int portNumber )
        , ( "mode", modeToJson mode )
        , ( "outputPath", Json.Encode.string outputPath )
        , ( "documentPath", Maybe.withDefault Json.Encode.null (Maybe.map Json.Encode.string documentPath) )
        , ( "contentTypes", Json.Encode.dict identity Json.Encode.string contentTypes )
        , ( "headers", Json.Encode.dict identity Json.Encode.string headers )
        ]


type alias TestFlags flags =
    { flags
        | seed : Maybe Int
        , fuzz : Int
        , test : Test
    }


testFlagsToJson : TestFlags flags -> Json.Encode.Value
testFlagsToJson { seed, fuzz } =
    Json.Encode.object
        [ ( "seed", Maybe.withDefault Json.Encode.null (Maybe.map Json.Encode.int seed) )
        , ( "fuzz", Json.Encode.int fuzz )
        ]


type alias BenchmarkFlags flags =
    { flags
        | benchmark : Benchmark
    }


benchmarkFlagsToJson : BenchmarkFlags flags -> Json.Encode.Value
benchmarkFlagsToJson _ =
    Json.Encode.object
        []


type BuildFormat
    = ImmediatelyInvokedFunctionInvocation
    | EcmaScriptModule


formatToJson : BuildFormat -> Json.Encode.Value
formatToJson format =
    case format of
        ImmediatelyInvokedFunctionInvocation ->
            Json.Encode.string "iife"

        EcmaScriptModule ->
            Json.Encode.string "esm"


type BuildMode
    = Develop
    | Debug
    | Optimize


modeToJson : BuildMode -> Json.Encode.Value
modeToJson mode =
    case mode of
        Develop ->
            Json.Encode.string "develop"

        Debug ->
            Json.Encode.string "debug"

        Optimize ->
            Json.Encode.string "optimize"
