import { GameObject, ParticleSystem, Quaternion, Transform } from 'UnityEngine';
import {SpawnInfo, ZepetoPlayer, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import { Player } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WorldService } from 'ZEPETO.World';
import CharacterController from '../Character/CharacterController';
import Main from '../Main';
import ClientScript from './Multiplay/ClientScript';

export enum PlayerTeam { VIRUS, SURVIVOR, GHOST, NONE }
export default class GameManager extends ZepetoScriptBehaviour {
    @Header("Initialization Objects")
    public spawnLocations : GameObject[];
    
    @Header("Character Components")
    public detectionTrigger: GameObject;
    public bodyPrefab: GameObject;
    public killFX: ParticleSystem;
    
    private spawnCount = 0;
    private virusId : string = "";

    private players : Map<string, CharacterController> = new Map<string, CharacterController>();

    private bodies : Map<string, GameObject> = new Map<string, GameObject>();
    private isLoadingPlayers: boolean = false;
    public Init()
    {
        this.StartCoroutine(this.WaitForPlayersToLoad());
    }
    
    public *WaitForPlayersToLoad()
    {
        this.isLoadingPlayers = true;
        while (!Main.instance.client.IsReady()) { yield; }
        
        let clientCount = Main.instance.client.multiplayRoom.State.players.Count;
        Main.instance.uiMgr.UpdateUIConsole(`Game is Ready to Begin. Waiting for players to load ${this.spawnCount}/${clientCount}`);
        while (this.spawnCount < clientCount) { yield; }
        this.isLoadingPlayers = false;
    }

    public GetSpawnTransform(spawnIndex: number): Transform
    {
        return this.spawnLocations[spawnIndex].transform;
    }
    
    public GetPlayerCC(userId: string) : CharacterController
    {
        if (this.players.has(userId))
            return this.players.get(userId);
        
        return null;
    }

    public AddSpawn(userId: string)
    {
        this.spawnCount++;
        let player: ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(userId);
        let cc : CharacterController = player.character.gameObject.AddComponent<CharacterController>();
        cc.Init(Main.instance.client.multiplayPlayers.get(userId));
        this.players.set(userId, cc);
        Main.instance.client.SendMessageClientReady();
    }

    public RemoveSpawn()
    {
        this.spawnCount--;
    }

    public *InitializeWithVirus(virusId: string)
    {
        while (this.isLoadingPlayers) { yield; }
        Main.instance.uiMgr.UpdateUIConsole(`All players Loaded. Assiging Virus... ${this.players.size}`);
        this.virusId = virusId;
        console.error("Assigning Teams for " + this.players.size + " Clients");
        this.players.forEach((value: CharacterController, key: string) => {
            let cc = value;
            
            console.error("Assigning team " + (cc.playerInfo.userId == virusId) + " to " + cc.playerInfo.userId);
            //Set as virus is id matches character. Otherwise, set survivor if ready, and ghost otherwise.
            if (cc.playerInfo.userId == virusId)
                cc.SetTeam(PlayerTeam.VIRUS);
            else
                cc.SetTeam(cc.IsReady() ? PlayerTeam.SURVIVOR : PlayerTeam.GHOST);
        });
    }
    
    public UpdateTeam(userId: string, teamId: number)
    {
        let cc = this.players.get(userId);
        cc.SetTeam(teamId as PlayerTeam);
    }
    
    public KillPlayer(userId: string)
    {
        if (!this.players.has(userId)) 
        {
            console.error(`Couldn't kill ${userId}, user doesn't exist or is already dead`);
            return; 
        }
        
        let cc = this.players.get(userId);
        Main.instance.client.SendMessageUpdateTeam(userId, PlayerTeam.GHOST);
        //cc.SetTeam(PlayerTeam.GHOST);
        
        let body: GameObject = GameObject.Instantiate<GameObject>(this.bodyPrefab, cc.transform.position, Quaternion.identity);
        body.gameObject.name = cc.playerInfo.userId;
    }
    
    public ReportBody(userId: string)
    {
        let body = this.bodies.get(userId);
        if (body != null)
        {
            GameObject.Destroy(body);
        }
        
        //Show Hall Meeting UI
        Main.instance.uiMgr.ShowVotingWin();
    }
    
    //Despawn character without removing user from the world server.
    public DespawnPlayer(userId: string)
    {
        if (WorldService.userId === userId)
        {
            console.error("Cannot Remove Local User!");
            return;
        }
        ZepetoPlayers.instance.RemovePlayer(userId);
        this.spawnCount--;
        this.players.delete(userId);
    }
    
    //Respawn a player that already exists in the world.
    public RespawnPlayer(userId: string)
    {
        let isLocal : boolean = (WorldService.userId === userId);
        
        //Don't Create another character controller if local
        if (isLocal)
        {
            let cc: CharacterController = this.players.get(userId);
            let spawnTrans = Main.instance.GetSpawnTransform(cc.playerInfo.spawnIndex);
            cc.zptPlayer.character.Teleport(spawnTrans.position, spawnTrans.rotation);
            return;
        }
        
        const player: Player = Main.instance.client.GetPlayer(userId);
        const spawnInfo = new SpawnInfo();
        const transformInfo : Transform = Main.instance.GetSpawnTransform(player.spawnIndex);
        console.log(transformInfo.gameObject.name);
        spawnInfo.position = transformInfo.position;
        spawnInfo.rotation = transformInfo.rotation;

        ZepetoPlayers.instance.CreatePlayerWithUserId(userId, userId, spawnInfo, isLocal);
    }
}
