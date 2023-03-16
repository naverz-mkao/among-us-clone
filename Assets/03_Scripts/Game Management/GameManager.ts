import { GameObject, ParticleSystem, Quaternion, Resources, Transform } from 'UnityEngine';
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
    private bodyPrefab: GameObject;
    private killFX: GameObject;
    
    private spawnCount = 0;
    private virusId : string = "";

    private players : Map<string, CharacterController> = new Map<string, CharacterController>();

    private bodies : Map<string, GameObject> = new Map<string, GameObject>();
    private isLoadingPlayers: boolean = false;
    
    private bodyParent: Transform;
    public Init()
    {
        this.bodyPrefab = Resources.Load<GameObject>("PlayerBody");
        this.killFX = Resources.Load<GameObject>("DeathFXTrail");

        ZepetoPlayers.instance.OnAddedPlayer.AddListener((userId) => {
            this.AddSpawn(userId);
        });
    }
    
    public RespawnPlayers(userIds: Array<string>)
    {
        //If players doesn't exist in map, respawn.
        userIds.forEach((userId) =>{
            let player: Player = ClientScript.GetInstance().GetPlayer(userId);
            console.log("Respawning: " + userId + " Team: " + player.team.teamId + " GhostID: " + PlayerTeam.GHOST);
            
            if (player.team.teamId == PlayerTeam.GHOST)
            {
               this.RespawnPlayer(userId);
            }
            else
            {
               console.log("Already Spawned");
            }
        });
    }
    
    public *WaitForPlayersToLoad()
    {
        this.isLoadingPlayers = true;
        while (!ClientScript.GetInstance().IsReady()) { yield; }
        
        let clientCount = ClientScript.GetInstance().multiplayRoom.State.players.Count;
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
    
    public GetAllPlayerCCs(): CharacterController[]
    {
        return Array.from(this.players.values());
    }

    public AddSpawn(userId: string)
    {
        this.spawnCount++;
        let player: ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(userId);
        let cc : CharacterController = player.character.gameObject.AddComponent<CharacterController>();
        
        cc.Init(ClientScript.GetInstance().GetPlayer(userId));
        this.players.set(userId, cc);
        this.StartCoroutine(this.WaitForInit(cc));
        console.error(ClientScript.GetInstance().GetPlayer(userId).userId + " Count: " + this.players.size);
    }
    
    public *WaitForInit(cc: CharacterController)
    {
        while (!cc.IsReady()) {yield;}
        ClientScript.GetInstance().SendMessageClientReady();
    }

    public RemoveSpawn()
    {
        this.spawnCount--;
    }

    public *InitializeWithVirus(virusId: string)
    {
        this.StartCoroutine(this.WaitForPlayersToLoad());
        while (this.isLoadingPlayers) { yield; }
        Main.instance.uiMgr.UpdateUIConsole(`All players Loaded. Assiging Virus... ${this.players.size}`);
        this.virusId = virusId;
        console.error("Assigning Teams for " + this.players.size + " Clients");
        
        this.players.forEach((value: CharacterController, key: string) => {
            let cc = value;
            console.error("Assigning team " + (cc.playerInfo.userId == virusId) + " to " + cc.playerInfo.userId);
            cc.SetTeam((cc.playerInfo.userId == virusId) ? PlayerTeam.VIRUS : PlayerTeam.SURVIVOR);
        });
        
        if (this.bodyParent != undefined)
        {
            GameObject.Destroy(this.bodyParent.gameObject);
        }
        
        this.bodyParent = new GameObject("BodyParent").transform;

        //LoadPlayer Profiles
        Main.instance.uiMgr.ShowFullScreenUI((WorldService.userId == virusId) ? "You are the virus" : "You are the survivor");
    }
    
    public UpdateTeam(userId: string, teamId: number)
    {
        let cc = this.players.get(userId);
        cc.SetTeam(teamId as PlayerTeam);
    }
    
    public ClearBodies()
    {
        GameObject.Destroy(this.bodyParent.gameObject);
    }
    
    public KillPlayer(userId: string)
    {
        if (!this.players.has(userId)) 
        {
            console.error(`Couldn't kill ${userId}, user doesn't exist or is already dead`);
            return; 
        }
        
        let cc = this.players.get(userId);
        
        //TODO: Change to SendMessage Kill Player
        ClientScript.GetInstance().SendMessageUpdateTeam(userId, PlayerTeam.GHOST);
        
        let body: GameObject = GameObject.Instantiate<GameObject>(this.bodyPrefab, cc.transform.position, Quaternion.identity);
        body.gameObject.name = cc.playerInfo.userId;
        body.transform.SetParent(this.bodyParent, true);
        
        Main.instance.uiMgr.ShowFullScreenUI(`You've deleted ${ClientScript.GetInstance().GetUsername(userId)}`);
    }
    
    //Despawn character without removing user from the world server.
    public DespawnPlayer(userId: string)
    {
        if (WorldService.userId === userId)
        {
            console.error("Cannot Remove Local User!");
            return;
        }
        //ZepetoPlayers.instance.GetPlayer(userId).character.gameObject.SetActive(false);
        ZepetoPlayers.instance.RemovePlayer(userId);
        this.spawnCount--;
        this.players.delete(userId);
    }
    
    //Respawn a player that already exists in the world.
    public RespawnPlayer(userId: string)
    {
        ClientScript.GetInstance().RespawnPlayer(userId);
    }
    
    //Voting Win Functions
    public VoteForUser(userId: string)
    {
        //TODO: Send Message to Server to Vote for player
        console.log(`Voting for User: ${userId}`);
        ClientScript.GetInstance().SendMessageVoteForVirus(userId);
    }
}
