port module RunMain exposing (main)

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
