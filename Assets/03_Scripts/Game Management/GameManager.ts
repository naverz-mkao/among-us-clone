import { GameObject, Quaternion } from 'UnityEngine';
import { SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WorldService } from 'ZEPETO.World';

export default class GameManager extends ZepetoScriptBehaviour {
    public spawnLocations : GameObject[];

    private playerCount = 0;

    public Init()
    {

    }

    public SpawnPlayer(userId: string)
    {
        //Create spawn info for our new character. 
        const spawnInfo = new SpawnInfo();
        const position = this.spawnLocations[this.playerCount].transform.position;
        spawnInfo.position = position;
        spawnInfo.rotation = Quaternion.identity;

        // If the added player id matches the world service id, we know this is the local player. 
        const isLocal = WorldService.userId === userId;

        // Instantiate character with the above settings. 
        ZepetoPlayers.instance.CreatePlayerWithUserId(userId, userId, spawnInfo, isLocal);

        //Potential Sync Timing Issue on failed client connect.
        this.playerCount++;
    }
}
