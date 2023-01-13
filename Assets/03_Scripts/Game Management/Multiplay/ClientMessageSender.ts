import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {CharacterState, ZepetoPlayers} from "ZEPETO.Character.Controller";
import {Transform, WaitForSeconds} from "UnityEngine";
import {WorldService} from "ZEPETO.World";
import ClientScript, * as CS from './ClientScript';
import { Room } from 'ZEPETO.Multiplay';
export default class ClientMessageSender{
    private client: ClientScript;
    
    private room : Room;
    public Init(client: ClientScript)
    {
        this.client = client;
    }
    
    public SetRoom(room : Room)
    {
        this.room = room;
    }
    
}