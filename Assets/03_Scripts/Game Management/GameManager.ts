import { GameObject, Quaternion, Transform } from 'UnityEngine';
import {SpawnInfo, ZepetoPlayer, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WorldService } from 'ZEPETO.World';
import CharacterController from '../Character/CharacterController';
import Main from '../Main';
import ClientScript from './Multiplay/ClientScript';

export enum PlayerTeam { VIRUS, SURVIVOR, GHOST }
export default class GameManager extends ZepetoScriptBehaviour {
    @Header("Initialization Objects")
    public spawnLocations : GameObject[];
    
    @Header("Character Components")
    public detectionTrigger: GameObject;
    
    private spawnCount = 0;
    private virusId : string = "";

    private players : Map<string, CharacterController> = new Map<string, CharacterController>()
    public Init()
    {
        this.StartCoroutine(this.WaitForPlayersToLoad());
    }
    
    public *WaitForPlayersToLoad()
    {
        let loadCount = (Main.instance.hasEnteredLobby) ? Main.instance.client.connectedClients : 1; 
        while (this.spawnCount < loadCount) { yield; }

        Main.instance.client.SendMessageInitializeGame();
    }

    public GetSpawnTransform(): Transform
    {
        return this.spawnLocations[this.spawnCount].transform;
    }

    public AddSpawn(userId: string)
    {
        this.spawnCount++;
        let player: ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(userId);
        let cc : CharacterController = player.character.gameObject.AddComponent<CharacterController>();
        cc.Init(Main.instance.client.multiplayPlayers.get(userId));
        this.players.set(userId, cc);
    }

    public RemoveSpawn()
    {
        this.spawnCount--;
    }

    public InitializeWithVirus(virusId: string)
    {
        this.virusId = virusId;
        this.players.forEach((value: CharacterController, key: string) => {
            let cc = value;
            
            //Set as virus is id matches character. Otherwise, set survivor if ready, and ghost otherwise.
            if (cc.playerInfo.userId == virusId)
                cc.SetTeam(PlayerTeam.VIRUS);
            else
                cc.SetTeam(cc.IsReady() ? PlayerTeam.SURVIVOR : PlayerTeam.GHOST);
        });
    }
}
