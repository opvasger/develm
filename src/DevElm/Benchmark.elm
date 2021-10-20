module DevElm.Benchmark exposing (BenchmarkResult, toBenchmarkResult)

import Benchmark exposing (Benchmark)
import Benchmark.Reporting
import Trend.Linear


type alias BenchmarkResult =
    {}


toBenchmarkResult : Benchmark -> BenchmarkResult
toBenchmarkResult benchmark =
    case Benchmark.Reporting.fromBenchmark benchmark of
        Benchmark.Reporting.Single label status ->
            Debug.todo "..."

        Benchmark.Reporting.Series label pairs ->
            Debug.todo "..."

        Benchmark.Reporting.Group label reports ->
            Debug.todo "..."


runsPerSecond : Trend.Linear.Trend Trend.Linear.Quick -> Int
runsPerSecond trend =
    floor (Trend.Linear.predictX (Trend.Linear.line trend) 1000)


goodnessOfFitPct : Trend.Linear.Trend Trend.Linear.Quick -> Float
goodnessOfFitPct trend =
    asPct 2 (Trend.Linear.goodnessOfFit trend)


asPct : Int -> Float -> Float
asPct decimalCount n =
    toFloat (floor (n * toFloat (10 ^ (2 + abs decimalCount)))) / toFloat (10 ^ abs decimalCount)
