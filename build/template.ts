export const version : [number,number,number] = [3,0,0]
export const elmModule : string = `port module Main exposing (main)

import Dev
import DevElm
import Json.Encode


port output : Json.Encode.Value -> Cmd msg


main : Program () () ()
main =
    Platform.worker
        { init = always ( (), output (DevElm.encodeConfiguration Dev.config) )
        , update = always (always ( (), Cmd.none ))
        , subscriptions = always Sub.none
        }
`
  