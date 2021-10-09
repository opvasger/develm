export const version : [number,number,number] = [5,0,1]
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
    case Test.Runner.fromTest flags.fuzz seed suite of
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


suite : Test.Test
suite =
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
    