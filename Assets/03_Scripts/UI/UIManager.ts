import {TextMeshPro, TextMeshProUGUI } from 'TMPro';
import {Color, GameObject, Time, Vector2, WaitForEndOfFrame, WaitForFixedUpdate, WaitForSecondsRealtime} from 'UnityEngine';
import { Button, Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { PlayerTeam } from '../Game Management/GameManager';
import ClientScript, { GameState } from '../Game Management/Multiplay/ClientScript';
import Main from '../Main';
import UICharacterController from './UICharacterController';
import UIVotingWinController from './UIVotingWinController';

export default class UIManager extends ZepetoScriptBehaviour {
    public fullScreenTimerDuration: number = 5;
    
    public uicontroller: UICharacterController;
    public fullScreenBG: Image;
    public messageText: TextMeshProUGUI;
    
    public fullScreenText: TextMeshProUGUI;
    public timerText: TextMeshProUGUI;
    public timer3DText: TextMeshPro;
    
    public votingWin: GameObject;
    public titleUI: GameObject;
    public titleFX: GameObject;
    
    public fullScreenMessageWin: GameObject;
    
    private uiVotingWinController: UIVotingWinController;
    
    private fullScreenTimer: number;
    private isShowingFullScreen: boolean;
    private fullScreenBGColor : Color;
    private fullScreenTextColor : Color;
    
    private lastTime: number;
    public Start()
    {
        this.fullScreenBGColor = this.fullScreenBG.color;
        this.fullScreenTextColor = this.fullScreenText.color;
        this.lastTime = -100;
    }
    
    public Init()
    {
        this.uiVotingWinController = this.votingWin.GetComponent<UIVotingWinController>();
    }

    public GetVotingWin(): UIVotingWinController
    {
        return this.uiVotingWinController;
    }
    
    public InitUI(uicontroller: UICharacterController)
    {
        this.uicontroller = uicontroller;
        this.SetUIState(GameState.Wait);
    }
    
    public SetUIState(state: GameState)
    {
        console.log("Setting State: " + state);
        if (state == GameState.Wait)
        {
            this.titleUI.SetActive(true);
            this.titleFX.SetActive(true);
        }
        else if (state == GameState.GameReady)
        {
            this.titleUI.SetActive(false);
            this.titleFX.SetActive(false);
        }
        else if (state == GameState.GameStart)
        {
            this.titleUI.SetActive(false);
            this.titleFX.SetActive(false);
        }
        else if (state == GameState.GameFinish)
        {
            this.titleUI.SetActive(false);
            this.titleFX.SetActive(false);
        }
    }

    ShowVotingWin()
    {
        this.votingWin.SetActive(true);
        this.uiVotingWinController.Show();
        this.uicontroller.gameObject.SetActive(false);
        this.messageText.transform.parent.gameObject.SetActive(false);
    }

    HideVotingWin(votedUser: string)
    {
        if (votedUser == "NONE")
        {
            this.ShowFullScreenUI("No users were deleted this time");
        }else
        {
            let username: string = ClientScript.GetInstance().GetUsername(votedUser);
            ClientScript.GetInstance().SendMessageUpdateTeam(votedUser, PlayerTeam.GHOST);
            this.ShowFullScreenUI(`Player ${username} has been deleted`);
        }
        
        Main.instance.gameMgr.ClearBodies();
        this.votingWin.SetActive(false);
        this.uicontroller.gameObject.SetActive(true);
        this.messageText.transform.parent.gameObject.SetActive(true);
    }

    UpdateWaitTimer(timer: number)
    {
        if (timer >= 0)
        {
            this.timer3DText.text = timer.toString();
            if (timer > 10)
                this.timer3DText.color = Color.green;
            else if (timer > 5)
                this.timer3DText.color = Color.yellow;
            else
                this.timer3DText.color = Color.red;
            this.UpdateUIConsole("Game will begin in.. " + timer);

            if (this.lastTime != timer)
            {
                this.lastTime = timer;

                if (timer == 0)
                {
                    this.lastTime = 0
                    Main.GetInstance().audioMgr.PlayAudio("Futuristic Sound 25");
                }
                else
                    Main.GetInstance().audioMgr.PlayAudio("Futuristic Sound 05");
            }
        }
        
        
        
    }
    
    UpdateMeetingTimer(timer: number)
    {
        this.timerText.text = Math.max(0,timer).toString();
    }

    SetVoteStatus()
    {
        
    }
    
    VoteForUser(userId: string, count: number)
    {
        this.uiVotingWinController.SetVoteCount(userId, count);
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
    
    public ShowFullScreenUI(msg: string)
    {
        this.fullScreenTimer = this.fullScreenTimerDuration;
        this.fullScreenText.text = msg;
        if (!this.isShowingFullScreen) { this.StartCoroutine(this.FullScreenUI()); }
    }
    
    public *FullScreenUI()
    {
        this.fullScreenMessageWin.SetActive(true);

        while (this.fullScreenTimer > 0)
        {
            let a: number = this.fullScreenTimer / this.fullScreenTimerDuration;
            this.fullScreenTimer -= Time.fixedUnscaledDeltaTime;
            
            let c = this.fullScreenBGColor;
            c.a = a;
            this.fullScreenBG.color = c;

            c = this.fullScreenTextColor;
            c.a = a;
            this.fullScreenText.color = c;
            yield WaitForFixedUpdate;
        }
        
        this.fullScreenMessageWin.SetActive(false);
    }
    
    public UpdateUIConsole(message: string)
    {
        this.messageText.text = message;
    }
}
