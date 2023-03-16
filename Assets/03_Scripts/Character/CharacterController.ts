import {Camera, Canvas, Debug, GameObject, Input, KeyCode, LayerMask, Material, Quaternion, Resources,
    Transform, Vector2, Vector3 } from 'UnityEngine';
import {LocalPlayer, ZepetoCamera, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Player } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Users, WorldService, ZepetoWorldHelper } from 'ZEPETO.World';
import { PlayerTeam } from '../Game Management/GameManager';
import ClientScript, { GameState } from '../Game Management/Multiplay/ClientScript';
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
    
    @HideInInspector() public team: PlayerTeam;
    
    private currentEvent: InteractibleObject;
    
    private targetPlayers: Map<string, string> = new Map<string, string>();

    public localCharacterLight: GameObject;
    
    private initializeCount: number = 0;
    
    private killFX : GameObject;
    private bodyObject: GameObject;
    
    public Awake()
    {
        this.initializeCount = 0;
        this.team = PlayerTeam.NONE;
    }
    
    public Start()
    {
        let killFXPrefab: GameObject = Resources.Load<GameObject>("DeathFXTrail");

        this.killFX = GameObject.Instantiate<GameObject>(killFXPrefab, this.transform.position, Quaternion.identity);
        this.killFX.transform.SetParent(this.transform, true);
        this.killFX.SetActive(false);
    
       
    }
    
    public IsReady() : boolean
    {
        return this.initializeCount >= (this.IsLocal() ? 2 : 1);
    }
    
    public Init(playerInfo: Player)
    {
        Debug.LogError("Character Controller Script Start")
        Debug.LogError("userID: " + playerInfo.userId);
        this.playerInfo = playerInfo;
        this.zptPlayer = ZepetoPlayers.instance.GetPlayer(this.playerInfo.userId);
        
        ZepetoWorldHelper.GetUserInfo([playerInfo.userId], (info : Users[]) => {
            ClientScript.GetInstance().SetUsername(playerInfo.userId, info[0].zepetoId);
            console.error("Set Username: " + ClientScript.GetInstance().GetUsername(playerInfo.userId) + " for object " + this.gameObject.name);
            this.initializeCount++;
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
            this.AddBody(this.gameObject);

            this.AddRenderCamera();
            this.initializeCount++;
        });
    }

    public AddBody(parent: GameObject)
    {
        let bodyPrefab: GameObject = Resources.Load<GameObject>("PlayerBody");
        this.bodyObject = GameObject.Instantiate<GameObject>(bodyPrefab, this.transform.position, Quaternion.identity);
        this.bodyObject.transform.SetParent(this.transform, true);
        this.bodyObject.SetActive(false);
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
    
    public ResetPosition()
    {
        let spawnTrans = Main.instance.GetSpawnTransform(this.playerInfo.spawnIndex, ClientScript.GetInstance().gameState == GameState.Wait);
        this.zptPlayer.character.Teleport(spawnTrans.position, spawnTrans.rotation);
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
            this.zptPlayer.character.Context.gameObject.SetActive(true);
            this.killFX.SetActive(false);
            this.bodyObject?.SetActive(false);
        }else if (team == PlayerTeam.SURVIVOR)
        {
            this.gameObject.tag = "Survivor";
            this.zptPlayer.character.Context.gameObject.SetActive(true);
            this.killFX.SetActive(false);
            this.bodyObject?.SetActive(false);
        }
        else if (team == PlayerTeam.GHOST)
        {
            this.gameObject.tag = "Ghost";
            
            this.zptPlayer.character.Context.gameObject.SetActive(false);
            
            console.error("Setting Kill " + this.killFX.gameObject.name + " to true");
            this.killFX.SetActive(true);
            this.bodyObject?.SetActive(true);
            
            //Despawn if not local
            // if (!this.IsLocal())
            // {
                
            //     console.log("Assigning as ghost");
            //     Main.instance.gameMgr.DespawnPlayer(this.playerInfo.userId);
            //     return;
            //}
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
        this.currentEvent = interactObject;
        let eventInfo : InteractionEvent = interactObject.GetEvent();
        if (eventInfo == InteractionEvent.MINIGAME_BUTTONCLICKER)
        {
            console.error("Enabling button Clicker");
            this.uiController.EnableUse(b);
        }
        else if (eventInfo == InteractionEvent.MEETING_HALL)
        {
            console.error("Enabling metting hall");
            this.uiController.EnableReport(b);
        }
        else if (eventInfo == InteractionEvent.MEETING_REPORTBODY)
        {
            this.uiController.EnableReport(b);
        }
    }
    public Use()
    {
        let eventInfo : InteractionEvent = this.currentEvent.GetEvent();
        console.log("Used " + eventInfo);
        if (eventInfo == InteractionEvent.MINIGAME_BUTTONCLICKER)
        {
            //TODO: Triger the minigame sequence. 
            let terminalID: number = parseInt(this.currentEvent.gameObject.name.split("_")[1]);
            console.log("Playing Button Minigame from " + this.currentEvent.gameObject.name + " ID: " + terminalID);
            Main.instance.terminalManager.InteractWithTerminal(terminalID);
        }
        else if (eventInfo == InteractionEvent.MEETING_HALL)
        {
            console.log("Calling Hall Meeting");
            Main.instance.uiMgr.ShowVotingWin();
        }
        else if (eventInfo == InteractionEvent.MEETING_REPORTBODY)
        {
            console.log("Calling Report Body");
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
        ClientScript.GetInstance().SendMessageCallMeeting(this.currentEvent.GetMessageBody());
    }
}