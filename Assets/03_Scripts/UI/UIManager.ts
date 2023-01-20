import { TextMeshProUGUI } from 'TMPro';
import { Vector2 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { PlayerTeam } from '../Game Management/GameManager';
import UICharacterController from './UICharacterController';

export default class UIManager extends ZepetoScriptBehaviour {
    public uicontroller: UICharacterController;
    public messageText: TextMeshProUGUI;
    
    public Init()
    {
        
    }
    
    public InitUI(uicontroller: UICharacterController)
    {
        this.uicontroller = uicontroller;
    }
    
    public SetTeam(team: PlayerTeam)
    {
        switch (team)
        {
            case PlayerTeam.VIRUS:
                this.UpdateUIConsole("You are the Virus. Go destroy the system!");
                break;
            case PlayerTeam.SURVIVOR:
                this.UpdateUIConsole("You are not the virus. Find the Virus and save zepeto!");
                break;
            case PlayerTeam.GHOST:
                this.UpdateUIConsole("You died... You can still help though, by completing missions!");
                break;
        }
    }
    
    public UpdateUIConsole(message: string)
    {
        this.messageText.text = message;
    }
}
