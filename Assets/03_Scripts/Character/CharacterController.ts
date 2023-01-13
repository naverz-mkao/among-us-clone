import {Camera, GameObject, Input, KeyCode, Quaternion, Vector2 } from 'UnityEngine';
import {LocalPlayer, ZepetoCamera, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Player } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WorldService } from 'ZEPETO.World';
import Main from '../Main';
import UICharacterController from '../UI/UICharacterController';

export default class CharacterController extends ZepetoScriptBehaviour {
    public playerInfo : Player;
    public isVirus = false;
    
    private player: ZepetoPlayer;
    public Init(playerInfo: Player)
    {
        this.playerInfo = playerInfo;
        GameObject.Find("ZepetoPlayers").GetComponent<UICharacterController>();
        this.player = ZepetoPlayers.instance.GetPlayer(this.playerInfo.userId);
        if (this.IsLocal())
            this.SetCamera();
    }
    
    public Update()
    {
        if (Input.GetKeyDown(KeyCode.T))
        {
            console.error(ZepetoPlayers.instance.LocalPlayer.zepetoCamera.gameObject.name);
        }
    }
    
    public IsLocal(): boolean
    {
        return (this.playerInfo.userId == WorldService.userId);
    }
    
    public SetCamera()
    {
        //NOTE: Might Potentially be an issue if the local player is already added by this point. 
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            let localPlayer : LocalPlayer = ZepetoPlayers.instance.LocalPlayer;
            let cam : ZepetoCamera = localPlayer.zepetoCamera;
            
            //Camera Settings
            cam.camera.orthographic = true;
            cam.camera.orthographicSize = 5;
            cam.cameraParent.rotation = Quaternion.Euler(0, 0, 0);
        });
    }
    
    public SetAsVirus(b : boolean)
    {
        if (this.playerInfo.userId == WorldService.userId)
        {
            Main.instance.uiMgr.SetupVirusUI(b);
        }
        
        this.isVirus = b;
    }
}