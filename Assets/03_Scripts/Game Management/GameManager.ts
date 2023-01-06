import { GameObject, Quaternion, Transform } from 'UnityEngine';
import { SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WorldService } from 'ZEPETO.World';
import Main from '../Main';

export default class GameManager extends ZepetoScriptBehaviour {
    public spawnLocations : GameObject[];

    private spawnCount = 0;

    public Init()
    {

    }

    public GetSpawnTransform(): Transform
    {
        return this.spawnLocations[this.spawnCount].transform;
    }

    public AddSpawn()
    {
        this.spawnCount++;
    }

    public RemoveSpawn()
    {
        this.spawnCount--;
    }

    
}
