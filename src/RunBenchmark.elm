port module RunBenchmark exposing (main)

import Benchmark
import Benchmark.Runner
import DevElm


type alias Model =
    {}


type Msg
    = DoNothing


port output : String -> Cmd msg


main : Program DevElm.BenchmarkFlags Model Msg
main =
    Platform.worker
        { init = init
        , update = update
        , subscriptions = always Sub.none
        }


init : DevElm.BenchmarkFlags -> ( Model, Cmd Msg )
init flags =
    ( {}, output (ansiRed "not implemented yet!") )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        _ =
            \_ -> benchmark
    in
    case msg of
        DoNothing ->
            ( model, Cmd.none )


benchmark : Benchmark.Benchmark
benchmark =
    Benchmark.benchmark "one plus one" (\_ -> 1 + 1)



-- Color


ansiRed : String -> String
ansiRed =
    ansi 31


ansiGreen : String -> String
ansiGreen =
    ansi 32


ansiYellow : String -> String
ansiYellow =
    ansi 33


ansiBlue : String -> String
ansiBlue =
    ansi 34


ansi : Int -> String -> String
ansi n text =
    "\u{001B}[" ++ String.fromInt n ++ "m" ++ text ++ "\u{001B}[0m"
