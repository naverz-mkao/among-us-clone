import { GameObject, Transform } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class LobbySystem extends ZepetoScriptBehaviour {
    public spawnLocations: Transform[];

    private spawnCount: number = 0;

    Start() {    

    }

    public Init()
    {

    }

    public GetSpawnTransform() : Transform
    {
        console.log(`${this.spawnCount}`);
        return this.spawnLocations[this.spawnCount];
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