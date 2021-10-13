port module RunBenchmark exposing (main)

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
        { init = \_ -> ( (), update benchmark )
        , update = \bench _ -> ( (), update bench )
        , subscriptions = always Sub.none
        }


update : Benchmark.Benchmark -> Cmd Benchmark.Benchmark
update bench =
    if Benchmark.done bench then
        output ("\n" ++ String.join "\n\n" (List.map printXYZ (xyzFromReport (Benchmark.Reporting.fromBenchmark bench))))

    else
        Task.perform identity (Benchmark.step bench)


benchmark : Benchmark.Benchmark
benchmark =
    Benchmark.benchmark "one plus one" (\_ -> 1 + 1)



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
                    xyzs ++ List.map (\( l, s ) -> ( labels ++ [ printLabel (ansiYellow label), printStatusLabel s l ], s )) pairs

                Benchmark.Reporting.Group label reports ->
                    xyzs ++ List.concat (List.map (\r -> evaluate r (labels ++ [ printLabel label ]) []) reports)
    in
    evaluate initReport [] []


printXYZ : XYZ -> String
printXYZ ( labels, status ) =
    String.join "\n" (labels ++ [ printStatus status ])


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
                ++ "\n"
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
            (\char result ->
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
    "\u{001B}[" ++ String.fromInt n ++ "m" ++ text ++ "\u{001B}[0m"
