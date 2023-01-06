import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject, Transform } from 'UnityEngine';
import CharacterController from './Character/CharacterController';
import GameManager from './Game Management/GameManager';
import UIManager from './UI/UIManager';
import ClientStarter from './Game Management/ClientStarter';
import LobbySystem from './Game Management/LobbySystem';

export default class Main extends ZepetoScriptBehaviour {
    public static instance: Main;

    public characterController: CharacterController;
    public gameMgr: GameManager;
    public uiMgr: UIManager;
    public lobby: LobbySystem;
    public client: ClientStarter;

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
        this.client = this.GetComponentInChildren<ClientStarter>();
        this.lobby = this.GetComponentInChildren<LobbySystem>();
    }

    public Start()
    {
        this.spawnedIds = new Array<string>();
        this.InitializeAll();


    }

    public InitializeAll()  
    {
        this.gameMgr?.Init();
        this.uiMgr?.Init();
        this.characterController?.Init();
        this.client?.Init();
        this.lobby?.Init();
    }

    public AddSpawn(userId: string)
    {
        if (this.spawnedIds.includes(userId)) { return; }

        this.spawnedIds.push(userId);
        if (this.gameMgr)
            this.gameMgr.AddSpawn();
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

}
