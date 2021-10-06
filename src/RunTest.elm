port module RunTest exposing (main)

import DevElm
import Expect
import Random
import Test
import Test.Runner
import Test.Runner.Failure


type alias Output =
    { message : String
    , exitCode : Maybe Int
    }


port output : Output -> Cmd msg


main : Program DevElm.TestConfiguration () ( DevElm.TestConfiguration, Random.Seed )
main =
    Platform.worker
        { init = \flags -> ( (), init flags )
        , update = \msg _ -> ( (), update msg )
        , subscriptions = always Sub.none
        }


init : DevElm.TestConfiguration -> Cmd ( DevElm.TestConfiguration, Random.Seed )
init flags =
    case flags.seed of
        Just n ->
            update ( flags, Random.initialSeed n )

        Nothing ->
            Random.generate (Tuple.pair flags) Random.independentSeed


update : ( DevElm.TestConfiguration, Random.Seed ) -> Cmd msg
update ( config, seed ) =
    case Test.Runner.fromTest config.fuzz seed suite of
        Test.Runner.Plain runners ->
            run config
                runners
                { exitCode = Just 0
                , message = ""
                }

        Test.Runner.Only runners ->
            run config
                runners
                { exitCode = Just 1
                , message = "\n" ++ ansiRed "✗" ++ " ran with " ++ ansiRed "Test.only"
                }

        Test.Runner.Skipping runners ->
            run config
                runners
                { exitCode = Just 1
                , message = "\n" ++ ansiRed "✗" ++ " ran with " ++ ansiRed "Test.skip"
                }

        Test.Runner.Invalid error ->
            output
                { exitCode = Just 1
                , message = error
                }


run : DevElm.TestConfiguration -> List Test.Runner.Runner -> Output -> Cmd msg
run config runners initOutput =
    let
        finalOutput =
            List.foldl foldRun initOutput runners
    in
    output
        { finalOutput
            | message =
                finalOutput.message
                    ++ (case finalOutput.exitCode of
                            Just 0 ->
                                ansiGreen "✓"

                            _ ->
                                ansiRed "✗"
                       )
                    ++ " "
                    ++ config.moduleName
                    ++ "."
                    ++ config.testName
                    ++ ""
        }


foldRun : Test.Runner.Runner -> Output -> Output
foldRun runner output_ =
    case List.filterMap Test.Runner.getFailureReason (runner.run ()) of
        [] ->
            output_

        failures ->
            { output_
                | exitCode = Just 1
                , message =
                    List.foldl
                        (\failure message ->
                            message
                                ++ Maybe.withDefault "" (Maybe.map ((++) "\n\ngiven ") failure.given)
                                ++ "\n\n"
                                ++ Test.Runner.Failure.format failure.description failure.reason
                        )
                        (String.join "\n"
                            (Test.Runner.formatLabels
                                ((++) "↓ ")
                                (ansiRed << (++) "✗ ")
                                runner.labels
                            )
                        )
                        failures
                        ++ "\n\n"
                        ++ output_.message
            }


suite : Test.Test
suite =
    Test.test "one is zero" (\_ -> Expect.equal 1 0)



-- Color


ansiRed : String -> String
ansiRed =
    ansi 31


ansiGreen : String -> String
ansiGreen =
    ansi 32


ansi : Int -> String -> String
ansi n text =
    "\u{001B}[" ++ String.fromInt n ++ "m" ++ text ++ "\u{001B}[0m"
