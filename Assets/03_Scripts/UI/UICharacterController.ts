import { PointerEventData } from 'UnityEngine.EventSystems';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Vector2} from "UnityEngine";

export default class UICharacterController extends ZepetoScriptBehaviour {

    public OnDrag()
    {
        
    }

    public TestInvoke(v2: Vector2)
    {
        console.log(`Invoke Success: (${v2.x}, ${v2.y})`);
    }
}