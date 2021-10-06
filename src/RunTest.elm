port module RunTest exposing (main)

import DevElm
import Expect
import Random
import Test
import Test.Runner
import Test.Runner.Failure


type alias Output =
    { message : String
    , exitCode : Int
    }


port output : Output -> Cmd msg


main : Program DevElm.TestFlags () ( DevElm.TestFlags, Random.Seed )
main =
    Platform.worker
        { init = \flags -> ( (), init flags )
        , update = \msg _ -> ( (), update msg )
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
    case Test.Runner.fromTest flags.fuzz seed suite of
        Test.Runner.Plain runners ->
            run flags
                runners
                { exitCode = 0
                , message = ""
                }

        Test.Runner.Only runners ->
            run flags
                runners
                { exitCode = 1
                , message = "\n" ++ ansiRed "✗" ++ " ran with " ++ ansiRed "Test.only" ++ "\n"
                }

        Test.Runner.Skipping runners ->
            run flags
                runners
                { exitCode = 1
                , message = "\n" ++ ansiRed "✗" ++ " ran with " ++ ansiRed "Test.skip" ++ "\n"
                }

        Test.Runner.Invalid error ->
            output
                { exitCode = 1
                , message = error
                }


run : DevElm.TestFlags -> List Test.Runner.Runner -> Output -> Cmd msg
run flags runners initOutput =
    let
        finalOutput =
            List.foldl foldRun initOutput runners
    in
    output
        { finalOutput
            | message =
                finalOutput.message
                    ++ (case finalOutput.exitCode of
                            0 ->
                                ansiGreen "✓"

                            _ ->
                                ansiRed "✗"
                       )
                    ++ " "
                    ++ flags.moduleName
                    ++ "."
                    ++ flags.testName
                    ++ ""
        }


foldRun : Test.Runner.Runner -> Output -> Output
foldRun runner output_ =
    case List.filterMap Test.Runner.getFailureReason (runner.run ()) of
        [] ->
            output_

        failures ->
            { output_
                | exitCode = 1
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
