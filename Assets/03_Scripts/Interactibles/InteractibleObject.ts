import {ZepetoScriptableObject, ZepetoScriptBehaviour } from 'ZEPETO.Script'
import InteractibleInfo, { InteractionEvent } from './InteractibleInfo';

export default class InteractibleObject extends ZepetoScriptBehaviour {
    public info: ZepetoScriptableObject<InteractibleInfo>;
    
    public GetEvent() : InteractionEvent
    {
        return this.info["event"];
    }
}