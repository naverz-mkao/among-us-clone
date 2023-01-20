import {Camera, GameObject, Input, KeyCode, Material, Quaternion, Vector2, Vector3 } from 'UnityEngine';
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
    
    public matGhost : Material;
    public matVirus : Material;
    public matSurvivor : Material;
    
    public uiController: UICharacterController;
    
    public zptPlayer: ZepetoPlayer;
    private team: PlayerTeam;
    
    private currentEvent: InteractionEvent;
    private currentTarget: string;
    
    private targetPlayers: Map<string, string> = new Map<string, string>();
    public Init(playerInfo: Player)
    {
        this.playerInfo = playerInfo;
        this.zptPlayer = ZepetoPlayers.instance.GetPlayer(this.playerInfo.userId);

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

    public IsVirus(): boolean
    {
        return (this.team == PlayerTeam.VIRUS);
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
    
    public AddTarget(userId: string)
    {
        if (this.targetPlayers.has(userId)) {return;}
        
        this.targetPlayers.set(userId, userId);
    }
    
    public RemoveTarget(userId: string)
    {
        if (!this.targetPlayers.has(userId)) {return;}

        this.targetPlayers.delete(userId);
    }
    
    public GetNearestTarget() : string
    {
        if (this.targetPlayers.size == 0) { return ""; };
        
        let closestDist : number = Infinity;
        let finalID: string = "";
        this.targetPlayers.forEach((value, key) => {
            let cc : CharacterController = Main.instance.gameMgr.GetPlayerCC(value);
            let dist: number = Vector3.Distance(this.transform.position, cc.transform.position);
            if (dist < closestDist)
            {
                closestDist = dist;
                finalID  = cc.playerInfo.userId;
            }
        });
        
        return finalID;
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
        if (this.team == team) { return; }
        if (this.playerInfo.userId == WorldService.userId)
        {
            this.uiController.SetTeam(team);
        }

        switch (team)
        {
            case PlayerTeam.VIRUS:
                this.gameObject.tag = "Survivor";
                break;
            case PlayerTeam.SURVIVOR:
                this.gameObject.tag = "Virus";
                break;
            case PlayerTeam.GHOST:
                this.gameObject.tag = "Ghost";
                
                //Despawn if not local
                if (!this.IsLocal())
                {
                    Main.instance.gameMgr.DespawnPlayer(this.playerInfo.userId);
                    return;
                }
                break;
        }
        
        this.team = team;
        this.SetMaterials(team);
        Main.instance.client.SendMessageUpdateTeam(this.playerInfo.userId, team);
    }
    
    public SetMaterials(team: PlayerTeam)
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
        console.log(`Killed ${this.currentTarget}`);
        Main.instance.gameMgr.KillPlayer(this.currentTarget);
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