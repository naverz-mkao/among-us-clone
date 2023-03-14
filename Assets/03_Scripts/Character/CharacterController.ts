import {Camera, Canvas, Debug, GameObject, Input, KeyCode, LayerMask, Material, Quaternion, Resources,
    Transform, Vector2, Vector3 } from 'UnityEngine';
import {LocalPlayer, ZepetoCamera, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Player } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Users, WorldService, ZepetoWorldHelper } from 'ZEPETO.World';
import { PlayerTeam } from '../Game Management/GameManager';
import ClientScript from '../Game Management/Multiplay/ClientScript';
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
    
    @HideInInspector() public username: string;
    private team: PlayerTeam;
    
    private currentEvent: InteractionEvent;
    
    private targetPlayers: Map<string, string> = new Map<string, string>();

    public localCharacterLight: GameObject;
    
    public Awake()
    {
        this.team = PlayerTeam.NONE;
    }
    
    public Init(playerInfo: Player)
    {
        Debug.LogError("Character Controller Script Start")
        Debug.LogError("userID: " + playerInfo.userId);
        this.playerInfo = playerInfo;
        this.zptPlayer = ZepetoPlayers.instance.GetPlayer(this.playerInfo.userId);
        
        ZepetoWorldHelper.GetUserInfo([playerInfo.userId], (info : Users[]) => {
            this.username = info[0].zepetoId;
        },  (error) => {
            console.log(error);
        });
        //NOTE: Might Potentially be an issue if the local player is already added by this point. 
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.SetCamera();

            //Initialize UI Elements
            this.uiController = ZepetoPlayers.instance.gameObject.transform.Find("UIZepetoPlayerControl").GetComponent<UICharacterController>();
            Main.instance.uiMgr.InitUI(this.uiController);
            Main.instance.characterController = this;
            
            //Spawn Trigger Area
            let trigger: CharacterTriggerCheck = GameObject.Instantiate<GameObject>(Main.instance.gameMgr.detectionTrigger, this.transform, false).GetComponent<CharacterTriggerCheck>();
            
            this.gameObject.layer = LayerMask.NameToLayer("Player");

            this.localCharacterLight = Resources.Load<GameObject>("CharacterLight");

            this.AddLight(this.gameObject);

            this.AddRenderCamera();
        });
    }

    public AddLight(parent: GameObject)
    {
        const characterLight: GameObject = GameObject.Instantiate(this.localCharacterLight, this.transform.position, Quaternion.identity) as GameObject;
        characterLight.transform.parent = parent.transform;
    }

    public AddRenderCamera()
    {
        GameObject.Find("UICanvas").GetComponent<Canvas>().worldCamera = GameObject.Find("ZepetoCamera").GetComponent<Camera>();
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
    
    public AddTarget(userId: string)
    {
        if (this.targetPlayers.has(userId)) {return;}
        this.targetPlayers.set(userId, userId);
        console.error("Added Target: " + userId + " Size: " + this.targetPlayers.size);
        this.uiController.EnableKill(true);
    }
    
    public RemoveTarget(userId: string)
    {
        if (!this.targetPlayers.has(userId)) {return;}

        this.targetPlayers.delete(userId);
        console.error("Removed Target: " + userId);
        if (this.targetPlayers.size == 0)
        {
            this.uiController.EnableKill(false);
        }
    }
    
    public GetNearestTarget() : string
    {
        console.error("Targets: " + this.targetPlayers.size);
        console.error(this.gameObject.name);
        if (this.targetPlayers.size == 0) { return ""; }
        
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
        cam.cameraParent.rotation = Quaternion.Euler(0, 45, 0);
    }

    public SetTeam(team: PlayerTeam)
    {
        //Main.instance.uiMgr.UpdateUIConsole(`Setting the team to ${team} Check: ${(this.team == team)} | ${(this.team != PlayerTeam.NONE)} | ${this.team} | ${team}`);
        if (this.team == team && this.team != PlayerTeam.NONE) { return; }
        console.error("Setting Team: " + team);
        
        if (this.playerInfo.userId == WorldService.userId)
        {
            this.uiController.SetTeam(team);
            Main.instance.uiMgr.SetTeam(team);
        }
    
        if (team == PlayerTeam.VIRUS)
        {
            this.gameObject.tag = "Virus";
        }else if (team == PlayerTeam.SURVIVOR)
        {
            this.gameObject.tag = "Survivor";
        }
        else if (team == PlayerTeam.GHOST)
        {
            this.gameObject.tag = "Ghost";

            //Despawn if not local
            if (!this.IsLocal())
            {
                console.log("Assigning as ghost");
                Main.instance.gameMgr.DespawnPlayer(this.playerInfo.userId);
                return;
            }
        }
        
        this.team = team;
        this.SetMaterials(team);
    }
    
    public GetTeam() : PlayerTeam
    {
        return this.team;
    }
    
    public SetMaterials(team: PlayerTeam)
    {
        switch (team)
        {
            case PlayerTeam.VIRUS:
                //Change the materials of the characater. 
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
            this.uiController.EnableReport(b);
        }
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
            Main.instance.uiMgr.ShowVotingWin();
        }
        else if (this.currentEvent == InteractionEvent.MEETING_REPORTBODY)
        {
            console.log("Calling Hall Meeting");
            Main.instance.uiMgr.ShowVotingWin();
        }
    }

    public Kill()
    {
        Main.instance.gameMgr.KillPlayer(this.GetNearestTarget());
    }

    public Sabotage()
    {
        console.log("Sabotaged");
    }

    public Report()
    {
        console.log("Reported");
        ClientScript.GetInstance().SendMessageCallMeeting();
    }
}