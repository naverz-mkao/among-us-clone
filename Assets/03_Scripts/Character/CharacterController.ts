import {Camera, GameObject, Input, KeyCode, Quaternion, Vector2 } from 'UnityEngine';
import {LocalPlayer, ZepetoCamera, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Player } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WorldService } from 'ZEPETO.World';
import { PlayerTeam } from '../Game Management/GameManager';
import InteractibleInfo, { InteractionEvent } from '../Interactibles/InteractibleInfo';
import InteractibleObject from '../Interactibles/InteractibleObject';
import Main from '../Main';
import UICharacterController from '../UI/UICharacterController';
import CharacterTriggerCheck from './CharacterTriggerCheck';

export default class CharacterController extends ZepetoScriptBehaviour {
    public playerInfo : Player;
    public isVirus = false;
    
    public uiController: UICharacterController;
    
    private player: ZepetoPlayer;
    
    private currentEvent: InteractionEvent;
    public Init(playerInfo: Player)
    {
        this.playerInfo = playerInfo;
        this.player = ZepetoPlayers.instance.GetPlayer(this.playerInfo.userId);

        //NOTE: Might Potentially be an issue if the local player is already added by this point. 
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.SetCamera();

            //Initialize UI Elements
            this.uiController = ZepetoPlayers.instance.gameObject.transform.GetComponentInChildren<UICharacterController>();
            Main.instance.uiMgr.InitUI(this.uiController);
            Main.instance.characterController = this;
            
            //Spawn Trigger Area
            let trigger: CharacterTriggerCheck = GameObject.Instantiate<GameObject>(Main.instance.gameMgr.detectionTrigger, this.transform, false).GetComponent<CharacterTriggerCheck>();
        });
    }
    
    public Update()
    {
        if (Input.GetKeyDown(KeyCode.T))
        {
            console.error(ZepetoPlayers.instance.LocalPlayer.zepetoCamera.gameObject.name);
        }
    }
    
    public IsLocal(): boolean
    {
        return (this.playerInfo.userId == WorldService.userId);
    }
    
    public IsReady(): boolean
    {
        //TODO: Set up ready depending on server value
        //return Main.instance.client.GetPlayer(this.playerInfo.userId).isReady;
        
        return true;
    }
    
    public SetCamera()
    {
        let localPlayer : LocalPlayer = ZepetoPlayers.instance.LocalPlayer;
        let cam : ZepetoCamera = localPlayer.zepetoCamera;
        
        //Camera Settings
        cam.cameraParent.rotation = Quaternion.Euler(0, 0, 0);
    }

    public SetTeam(team: PlayerTeam)
    {
        if (this.playerInfo.userId == WorldService.userId)
        {
            this.uiController.SetTeam(team);
        }

        switch (team)
        {
            case PlayerTeam.VIRUS:
                this.isVirus = true;
                break;
            case PlayerTeam.SURVIVOR:
                this.isVirus = false;
                break;
            case PlayerTeam.GHOST:
                this.isVirus = false;
                break;
        }
    }
    
    public EnableInteraction(b: boolean, interactObject: InteractibleObject)
    {
        this.currentEvent = interactObject.GetEvent();
        if (this.currentEvent == InteractionEvent.MINIGAME_BUTTONCLICKER)
        {
            this.uiController.EnableUse(b);
        }
        else if (this.currentEvent == InteractionEvent.MEETING_HALL)
        {
            this.uiController.EnableUse(b);
        }
        else if (this.currentEvent == InteractionEvent.MEETING_REPORTBODY)
        {
            this.uiController.EnableUse(b);
        }
        
        //Switch statement does not work for some reason
        // switch (this.currentEvent)
        // {
        //     case InteractionEvent.MINIGAME_BUTTONCLICKER:
        //         console.log("Enabling Button Clicker Event");
        //         this.uiController.EnableUse(b);
        //         break;
        //     case InteractionEvent.MEETING_HALL:
        //         this.uiController.EnableUse(b);
        //         break;
        //     case InteractionEvent.MEETING_REPORTBODY:
        //         this.uiController.EnableUse(b);
        //         break;
        //     default:
        //         console.log("INteraction Failed: " + (this.currentEvent == InteractionEvent.MINIGAME_BUTTONCLICKER));
        //         break;
        // }
    }
    
    public Use()
    {
        console.log("Used " + this.currentEvent);
        if (this.currentEvent == InteractionEvent.MINIGAME_BUTTONCLICKER)
        {
            console.log("Playing Button Minigame");
        }
        else if (this.currentEvent == InteractionEvent.MEETING_HALL)
        {
            console.log("Calling Hall Meeting");
        }
        else if (this.currentEvent == InteractionEvent.MEETING_REPORTBODY)
        {
            console.log("Reporting Body");
        }
    }
    
    public Kill()
    {
        console.log("Killed");
    }
    
    public Sabotage()
    {
        console.log("Sabotaged");
    }
    
    public Report()
    {
        console.log("Reported");
    }
}