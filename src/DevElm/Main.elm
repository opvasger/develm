module DevElm.Main exposing
    ( BenchmarkFlags
    , BuildFlags
    , BuildFormat(..)
    , BuildMode(..)
    , Flags(..)
    , LogFlags(..)
    , ServeFlags
    , TestFlags
    )

import Dict exposing (Dict)


type Flags flags
    = Batch (List (Flags flags))
    | Sequence (List (Flags flags))
    | OneOf (List ( String, Flags flags ))
    | Log LogFlags
    | Build (BuildFlags flags)
    | Serve (ServeFlags flags)
    | Test (TestFlags flags)
    | Benchmark (BenchmarkFlags flags)


type LogFlags
    = Text String
    | Version


type alias BuildFlags flags =
    { flags
        | outputPath : Maybe String
        , format : BuildFormat
        , mode : BuildMode
    }


type alias ServeFlags flags =
    { flags
        | hostName : String
        , outputPath : String
        , format : BuildFormat
        , mode : BuildMode
        , portNumber : Int
        , documentPath : Maybe String
        , contentTypes : Dict String String
        , headers : Dict String String
    }


type alias TestFlags flags =
    { flags
        | seed : Maybe Int
        , fuzz : Int
    }


type alias BenchmarkFlags flags =
    flags


type BuildFormat
    = ImmediatelyInvokedFunctionInvocation
    | EcmaScriptModule


type BuildMode
    = Develop
    | Debug
    | Optimize
