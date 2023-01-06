import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject } from 'UnityEngine';
import CharacterController from './Character/CharacterController';
import GameManager from './Game Management/GameManager';
import UIManager from './UI/UIManager';
import ClientStarter from './Game Management/ClientStarter';

export default class Main extends ZepetoScriptBehaviour {
    public static instance: Main;

    public characterController: CharacterController;
    public gameMgr: GameManager;
    public uiMgr: UIManager;
    public client: ClientStarter;

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
        this.characterController = this.GetComponentInChildren<CharacterController>();
        this.client = this.GetComponentInChildren<ClientStarter>();
    }

    public Start()
    {
        this.InitializeAll();
    }

    public InitializeAll()  
    {
        this.gameMgr.Init();
        this.uiMgr.Init();
        this.characterController.Init();
        this.client.Init();
    }

}
