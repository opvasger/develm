module DevElm.Test exposing (TestResult, toTestResult)

import DevElm.Main
import Random
import Test exposing (Test)
import Test.Runner


type alias TestResult =
    {}


{-| -}
toTestResult : DevElm.Main.TestFlags { defaultSeed : Int } -> Test -> TestResult
toTestResult flags test =
    case
        Test.Runner.fromTest flags.fuzz
            (Random.initialSeed (Maybe.withDefault flags.defaultSeed flags.seed))
            test
    of
        Test.Runner.Plain runners ->
            Debug.todo "..."

        Test.Runner.Only runners ->
            Debug.todo "..."

        Test.Runner.Skipping runners ->
            Debug.todo "..."

        Test.Runner.Invalid error ->
            Debug.todo "..."
