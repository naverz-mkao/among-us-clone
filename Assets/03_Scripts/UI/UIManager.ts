import { TextMeshProUGUI } from 'TMPro';
import {GameObject, Vector2 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { PlayerTeam } from '../Game Management/GameManager';
import UICharacterController from './UICharacterController';

export default class UIManager extends ZepetoScriptBehaviour {
    public uicontroller: UICharacterController;
    public messageText: TextMeshProUGUI;
    
    public votingWin: GameObject;
    public Init()
    {
        
    }
    
    public InitUI(uicontroller: UICharacterController)
    {
        this.uicontroller = uicontroller;
    }
    
    ShowVotingWin()
    {
        this.votingWin.SetActive(true);
    }
    
    public SetTeam(team: PlayerTeam)
    {
        if (team == PlayerTeam.VIRUS)
        {
            this.UpdateUIConsole("You are the Virus. Go destroy the system!");
        }
        else if (team == PlayerTeam.SURVIVOR)
        {
            this.UpdateUIConsole("You are not the virus. Find the Virus and save zepeto!");
        }
        else if (team == PlayerTeam.GHOST)
        {
            this.UpdateUIConsole("You died... You can still help though, by completing missions!");
        }
    }
    
    public UpdateUIConsole(message: string)
    {
        this.messageText.text = message;
    }
}
