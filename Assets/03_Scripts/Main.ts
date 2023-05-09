import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject, Transform } from 'UnityEngine';
import CharacterController from './Character/CharacterController';
import GameManager from './Game Management/GameManager';
import UIManager from './UI/UIManager';
import {ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import ClientScript from './Game Management/Multiplay/ClientScript';
import {LoadSceneMode, SceneManager } from 'UnityEngine.SceneManagement';
import {Users, ZepetoWorldHelper} from "ZEPETO.World";
import TerminalManager from './Game Management/TerminalManager';
import AudioManager from './Game Management/AudioManager';

export default class Main extends ZepetoScriptBehaviour {
    public static instance: Main;

    public characterController: CharacterController;
    public gameMgr: GameManager;
    public uiMgr: UIManager;
    public audioMgr: AudioManager;
    public terminalManager: TerminalManager;
    
    public hasEnteredLobby : boolean = false;

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
        this.gameMgr = this.transform.Find("GameManager").GetComponent<GameManager>();
        this.uiMgr = this.transform.Find("UIManager").GetComponent<UIManager>();
        this.terminalManager = this.transform.Find("TerminalManager").GetComponent<TerminalManager>();
        this.audioMgr = this.transform.Find("AudioManager").GetComponent<AudioManager>();
    }

    public Start()
    {
        this.StartCoroutine(this.InitializeAll());
    }
    
    public GetLocalCC()
    {
        return this.characterController;
    }

    public *InitializeAll()  
    {
        this.gameMgr?.Init();
        this.uiMgr?.Init();
    }
    
    public LocalCharacter(): CharacterController
    {
        return this.characterController;
    }

    public RemoveSpawn(userId: string)
    {
        this.gameMgr?.RemoveSpawn();
    }

    public GetSpawnTransform(spawnIndex: number, isLobby : boolean): Transform
    {
        return this.gameMgr?.GetSpawnTransform(spawnIndex, isLobby);
    }
    
    public InitializeWithVirus(virusId: string)
    {
        if (this.gameMgr == undefined) { return; }
        console.log(`Setting Virus with id ${virusId}`);
        
        Main.instance.terminalManager.ResetAllTerminals();
        this.characterController.ResetPosition();
        
        let playerIds: string[] = ClientScript.GetInstance().GetPlayerIDs();
        this.gameMgr.RespawnPlayers(playerIds);
        
        this.StartCoroutine(this.gameMgr.InitializeWithVirus(virusId));
    }
}
