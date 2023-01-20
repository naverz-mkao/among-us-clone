import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject, Transform } from 'UnityEngine';
import CharacterController from './Character/CharacterController';
import GameManager from './Game Management/GameManager';
import UIManager from './UI/UIManager';
import LobbySystem from './Game Management/LobbySystem';
import {ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import ClientScript from './Game Management/Multiplay/ClientScript';

export default class Main extends ZepetoScriptBehaviour {
    public static instance: Main;

    public characterController: CharacterController;
    public gameMgr: GameManager;
    public uiMgr: UIManager;
    public lobby: LobbySystem;
    public client: ClientScript;
    
    public hasEnteredLobby : boolean = false;

    private spawnedIds: string[];

    public static GetInstance(): Main
    {
        let gameObject = GameObject.Find("Main");
        if (gameObject != null)
            return gameObject.GetComponent<Main>();
        else
            return new Main();
    }

    public Awake()
    {
        Main.instance = this;
        this.gameMgr = this.GetComponentInChildren<GameManager>();
        this.uiMgr = this.GetComponentInChildren<UIManager>();
        this.client = this.GetComponentInChildren<ClientScript>();
        this.lobby = this.GetComponentInChildren<LobbySystem>();
    }

    public Start()
    {
        this.spawnedIds = new Array<string>();
        this.StartCoroutine(this.InitializeAll());
    }

    public *InitializeAll()  
    {
        console.log("Initializing");
        //WaitFor ClientInit First
        this.client?.Init();
        while (ClientScript.isInitializing) { yield; }
        
        this.gameMgr?.Init();
        this.uiMgr?.Init();
        this.lobby?.Init();
        this.InitializePlayers();
    }

    public InitializePlayers()
    {
        ZepetoPlayers.instance.OnAddedPlayer.AddListener((userId) => {
            this.AddSpawn(userId);
        });
    }

    public AddSpawn(userId: string)
    {
        if (this.spawnedIds.includes(userId)) { return; }
        console.log("Initializing ID " + userId);
        this.spawnedIds.push(userId);
        if (this.gameMgr)
            this.gameMgr.AddSpawn(userId);
        if (this.lobby)
            this.lobby.AddSpawn();
    }

    public RemoveSpawn(userId: string)
    {
        if (!this.spawnedIds.includes(userId)) { return; }

        let index = this.spawnedIds.indexOf(userId);
        this.spawnedIds.splice(index, 1);
        if (this.gameMgr)
            this.gameMgr.RemoveSpawn();
        if (this.lobby)
            this.lobby.RemoveSpawn();
    }

    public GetSpawnTransform(): Transform
    {
        if (this.gameMgr != undefined)
            return this.gameMgr.GetSpawnTransform();
        else if (this.lobby != undefined)
            return this.lobby.GetSpawnTransform();
        else 
            return new Transform();
    }
    
    public InitializeWithVirus(virusId: string)
    {
        if (this.gameMgr == undefined) { return; }
        console.log(`Setting Virus with id ${virusId}`);
        this.gameMgr.InitializeWithVirus(virusId);
    }
}
