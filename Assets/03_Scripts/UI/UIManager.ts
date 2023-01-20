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
                break;
            case PlayerTeam.SURVIVOR:
                break;
            case PlayerTeam.GHOST:
                break;
        }
    }
    
    public UpdateUIConsole(message: string)
    {
        this.messageText.text = message;
    }
}
