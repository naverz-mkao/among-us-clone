import { TextMeshProUGUI } from 'TMPro';
import {GameObject, Vector2 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { PlayerTeam } from '../Game Management/GameManager';
import UICharacterController from './UICharacterController';
import UIVotingWinController from './UIVotingWinController';

export default class UIManager extends ZepetoScriptBehaviour {
    public uicontroller: UICharacterController;
    public uiVotingWinController: UIVotingWinController;
    public messageText: TextMeshProUGUI;
    public timerText: TextMeshProUGUI;
    
    public votingWin: GameObject;
    public Init()
    {
        this.uiVotingWinController = this.votingWin.GetComponent<UIVotingWinController>();
    }
    
    public InitUI(uicontroller: UICharacterController)
    {
        this.uicontroller = uicontroller;
    }
    
    public GetVotingWin(): UIVotingWinController
    {
        return this.uiVotingWinController;
    }
    
    ShowVotingWin()
    {
        this.votingWin.SetActive(true);
        this.uiVotingWinController.Show();
        this.uicontroller.gameObject.SetActive(false);
        this.messageText.transform.parent.gameObject.SetActive(false);
    }
    
    HideVotingWin()
    {
        this.votingWin.SetActive(false);
        this.uicontroller.gameObject.SetActive(true);
        this.messageText.transform.parent.gameObject.SetActive(true);
    }
    
    UpdateMeetingTimer(timer: number)
    {
        this.timerText.text = timer.toString();
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
