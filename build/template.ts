export const version : [number,number,number] = [6,0,0]
  export const mainModule : string = `port module RunMain exposing (main)

import Dev
import DevElm
import Json.Encode


port output : Json.Encode.Value -> Cmd msg


main : Program () () ()
main =
    Platform.worker
        { init = always ( (), output (DevElm.encodeFlags Dev.flags) )
        , update = always (always ( (), Cmd.none ))
        , subscriptions = always Sub.none
        }
`
  export const testModule : string = `port module RunTest exposing (main)

import DevElm
import Expect
import Random
import Test
import Test.Runner
import Test.Runner.Failure


type alias Output =
    { message : String
    , exitCode : Int
    , passCount : Int
    , failCount : Int
    }


emptyOutput : Output
emptyOutput =
    { exitCode = 0
    , message = ""
    , passCount = 0
    , failCount = 0
    }


port output : Output -> Cmd msg


main : Program DevElm.TestFlags () ( DevElm.TestFlags, Random.Seed )
main =
    Platform.worker
        { init = \\flags -> ( (), init flags )
        , update = \\msg _ -> ( (), update msg )
        , subscriptions = always Sub.none
        }


init : DevElm.TestFlags -> Cmd ( DevElm.TestFlags, Random.Seed )
init flags =
    case flags.seed of
        Just n ->
            update ( flags, Random.initialSeed n )

        Nothing ->
            Random.generate (Tuple.pair flags) Random.independentSeed


update : ( DevElm.TestFlags, Random.Seed ) -> Cmd msg
update ( flags, seed ) =
    case Test.Runner.fromTest flags.fuzz seed test of
        Test.Runner.Plain runners ->
            run flags runners emptyOutput

        Test.Runner.Only runners ->
            run flags
                runners
                { emptyOutput
                    | exitCode = 1
                    , message = ansiRed "✗" ++ " ran using " ++ ansiRed "Test.only" ++ "\\n"
                }

        Test.Runner.Skipping runners ->
            run flags
                runners
                { emptyOutput
                    | exitCode = 1
                    , message = ansiRed "✗" ++ " ran using " ++ ansiRed "Test.skip" ++ "\\n"
                }

        Test.Runner.Invalid error ->
            output
                { emptyOutput
                    | exitCode = 1
                    , message = error
                }


run : DevElm.TestFlags -> List Test.Runner.Runner -> Output -> Cmd msg
run flags runners initOutput =
    let
        outputInfo =
            List.foldl foldRun initOutput runners
    in
    output
        { outputInfo
            | message =
                "\\n"
                    ++ outputInfo.message
                    ++ (case outputInfo.failCount of
                            0 ->
                                ansiGreen "✓"

                            _ ->
                                ansiRed "✗"
                       )
                    ++ (if outputInfo.failCount == 0 then
                            " passed "
                                ++ (if outputInfo.passCount > 2 then
                                        "all "

                                    else
                                        ""
                                   )
                                ++ ansiGreen
                                    (String.fromInt outputInfo.passCount
                                        ++ " test"
                                        ++ (if outputInfo.passCount /= 1 then
                                                "s"

                                            else
                                                ""
                                           )
                                    )

                        else
                            " failed "
                                ++ ansiRed
                                    (String.fromInt outputInfo.failCount
                                        ++ " test"
                                        ++ (if outputInfo.failCount /= 1 then
                                                "s"

                                            else
                                                ""
                                           )
                                    )
                       )
                    ++ " in "
                    ++ (flags.moduleName ++ "." ++ ansiBlue flags.testName)
                    ++ Maybe.withDefault ""
                        (Maybe.map
                            (\\seed ->
                                "\\n↻ seeded with "
                                    ++ ansiYellow (String.fromInt seed)
                            )
                            flags.seed
                        )
        }


foldRun : Test.Runner.Runner -> Output -> Output
foldRun runner outputPart =
    case List.filterMap Test.Runner.getFailureReason (runner.run ()) of
        [] ->
            { outputPart | passCount = outputPart.passCount + 1 }

        failures ->
            { outputPart
                | exitCode = 1
                , failCount = outputPart.failCount + 1
                , message =
                    List.foldl
                        (\\failure message ->
                            message
                                ++ Maybe.withDefault "" (Maybe.map ((++) "\\n\\ngiven ") failure.given)
                                ++ "\\n\\n"
                                ++ Test.Runner.Failure.format failure.description failure.reason
                        )
                        (String.join "\\n"
                            (Test.Runner.formatLabels
                                ((++) "↓ ")
                                ((++) (ansiRed "✗ ") << ansiBlue)
                                runner.labels
                            )
                        )
                        failures
                        ++ "\\n\\n"
                        ++ outputPart.message
            }


test : Test.Test
test =
    Test.test "one is zero" (\\_ -> Expect.equal 1 0)



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
    "\\u{001B}[" ++ String.fromInt n ++ "m" ++ text ++ "\\u{001B}[0m"
`
  export const benchmarkModule : string = `port module RunBenchmark exposing (main)

import Benchmark
import Benchmark.Reporting
import Benchmark.Status
import DevElm
import Task
import Trend.Linear


port output : String -> Cmd msg


main : Program DevElm.BenchmarkFlags () Benchmark.Benchmark
main =
    Platform.worker
        { init = \\_ -> ( (), update benchmark )
        , update = \\bench _ -> ( (), update bench )
        , subscriptions = always Sub.none
        }


update : Benchmark.Benchmark -> Cmd Benchmark.Benchmark
update bench =
    if Benchmark.done bench then
        output ("\\n" ++ String.join "\\n\\n" (List.map printXYZ (xyzFromReport (Benchmark.Reporting.fromBenchmark bench))))

    else
        Task.perform identity (Benchmark.step bench)


benchmark : Benchmark.Benchmark
benchmark =
    Benchmark.benchmark "one plus one" (\\_ -> 1 + 1)



-- Report


type alias XYZ =
    ( List String, Benchmark.Status.Status )


xyzFromReport : Benchmark.Reporting.Report -> List XYZ
xyzFromReport initReport =
    let
        evaluate report labels xyzs =
            case report of
                Benchmark.Reporting.Single label status ->
                    xyzs ++ [ ( labels ++ [ printStatusLabel status (ansiBlue label) ], status ) ]

                Benchmark.Reporting.Series label pairs ->
                    xyzs ++ List.map (\\( l, s ) -> ( labels ++ [ printLabel (ansiYellow label), printStatusLabel s l ], s )) pairs

                Benchmark.Reporting.Group label reports ->
                    xyzs ++ List.concat (List.map (\\r -> evaluate r (labels ++ [ printLabel label ]) []) reports)
    in
    evaluate initReport [] []


printXYZ : XYZ -> String
printXYZ ( labels, status ) =
    String.join "\\n" (labels ++ [ printStatus status ])


printStatus : Benchmark.Status.Status -> String
printStatus status =
    case status of
        Benchmark.Status.Cold ->
            ansiYellow "✗"
                ++ " waiting for the JIT to warm up"

        Benchmark.Status.Unsized ->
            ansiYellow "✗"
                ++ " determining sample size"

        Benchmark.Status.Pending _ _ ->
            ansiYellow "✗"
                ++ " waiting for more samples"

        Benchmark.Status.Failure (Benchmark.Status.MeasurementError _) ->
            ansiRed "✗"
                ++ " failed during "
                ++ ansiRed "measurement"

        Benchmark.Status.Failure (Benchmark.Status.AnalysisError _) ->
            ansiRed "✗"
                ++ " failed during "
                ++ ansiRed "analysis"

        Benchmark.Status.Success _ trend ->
            printRunsPerSecond trend
                ++ "\\n"
                ++ printGoodnessOfFit trend


printGoodnessOfFit : Trend.Linear.Trend Trend.Linear.Quick -> String
printGoodnessOfFit trend =
    let
        gof =
            asPct 2 (Trend.Linear.goodnessOfFit trend)

        gofColor =
            if gof < 25 then
                ansiRed

            else if gof < 50 then
                ansiYellow

            else if gof < 75 then
                ansiBlue

            else
                ansiGreen
    in
    "⚖ measured goodness of fit was "
        ++ gofColor (String.fromFloat gof ++ "%")


printRunsPerSecond : Trend.Linear.Trend Trend.Linear.Quick -> String
printRunsPerSecond trend =
    "☉ ran "
        ++ ansiGreen (toReadableInt (floor (Trend.Linear.predictX (Trend.Linear.line trend) 1000)))
        ++ " times per second"


asPct : Int -> Float -> Float
asPct decimalCount n =
    toFloat (floor (n * toFloat (10 ^ (2 + abs decimalCount)))) / toFloat (10 ^ abs decimalCount)


toReadableInt : Int -> String
toReadableInt n =
    String.fromList
        (String.foldr
            (\\char result ->
                { result
                    | index = result.index + 1
                    , readable =
                        if modBy 3 result.index == 0 && not (List.isEmpty result.readable) then
                            char :: '.' :: result.readable

                        else
                            char :: result.readable
                }
            )
            { index = 0, readable = [] }
            (String.fromInt n)
        ).readable


printLabel : String -> String
printLabel label =
    "↓ " ++ label


printStatusLabel : Benchmark.Status.Status -> String -> String
printStatusLabel status label =
    if isSuccess status then
        ansiGreen "✓ " ++ ansiBlue label

    else
        ansiRed "✗ " ++ ansiBlue label


isSuccess : Benchmark.Status.Status -> Bool
isSuccess status =
    case status of
        Benchmark.Status.Success _ _ ->
            True

        _ ->
            False



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
    "\\u{001B}[" ++ String.fromInt n ++ "m" ++ text ++ "\\u{001B}[0m"
`
    