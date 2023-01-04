import { ZepetoScriptBehaviour } from  'ZEPETO.Script' 
import { SpawnInfo , ZepetoPlayers , LocalPlayer , ZepetoCharacter } from  
'ZEPETO.Character.Controller'
import { GameObject, Light, Quaternion } from 'UnityEngine';
 
export  default  class  CharacterController  extends  ZepetoScriptBehaviour {
    public characterLight: GameObject;
    Start () {        
        ZepetoPlayers . instance . CreatePlayerWithZepetoId ( "" , "Jane" , new  SpawnInfo (), true );

        ZepetoPlayers . instance . OnAddedLocalPlayer . AddListener ( () => {
            let _player : LocalPlayer = ZepetoPlayers.instance.LocalPlayer;
            let _character = _player.zepetoPlayer.character;
            let myLight:GameObject = GameObject.Instantiate(this.characterLight, _character.transform.position, Quaternion.identity) as GameObject;
            myLight.transform.parent = _character.transform.gameObject.transform;
        });
   }
}