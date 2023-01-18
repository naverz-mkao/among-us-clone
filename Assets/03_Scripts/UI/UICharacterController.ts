import { PointerEventData } from 'UnityEngine.EventSystems';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {GameObject, Vector2} from "UnityEngine";
import { PlayerTeam } from '../Game Management/GameManager';
import { Button } from 'UnityEngine.UI';
import Main from '../Main';

export default class UICharacterController extends ZepetoScriptBehaviour {
    public useButton : Button;
    public sabotageButton: Button;
    public reportButton: Button;
    public killButton: Button;
    
    public Start()
    {   
        this.useButton.gameObject.SetActive(false);
        this.useButton.onClick.AddListener(() => { Main.instance.characterController.Use(); });
        this.sabotageButton.gameObject.SetActive(false);
        this.sabotageButton.onClick.AddListener(() => { Main.instance.characterController.Sabotage(); });
        this.reportButton.gameObject.SetActive(false);
        this.reportButton.onClick.AddListener(() => { Main.instance.characterController.Report(); });
        this.killButton.gameObject.SetActive(false);
        this.killButton.onClick.AddListener(() => { Main.instance.characterController.Kill(); });
    }

    public SetTeam(team: PlayerTeam)
    {
        switch (team)
        {
            case PlayerTeam.VIRUS:
                this.reportButton.gameObject.SetActive(true);
                this.killButton.gameObject.SetActive(true);

                this.EnableSabotage(false);
                this.EnableUse(false);
                this.EnableKill(false);
                this.EnableReport(false);
                break;
            case PlayerTeam.SURVIVOR:
                this.ActivateUse();
                this.reportButton.gameObject.SetActive(true);
                //this.reportButton.interactible = false;
                this.killButton.gameObject.SetActive(false);
                break;
            case PlayerTeam.GHOST:
                this.ActivateUse();
                this.reportButton.gameObject.SetActive(true);
                //this.reportButton.interactible = false;
                this.killButton.gameObject.SetActive(false);
                break;
        }
    }
    
    public EnableUse(b: bool)
    {
        if (b)
            this.ActivateUse();
        else
            this.ActivateSabotage();
        this.useButton.interactable = b;
    }

    public EnableReport(b: bool)
    {
        this.reportButton.interactable = b;
    }

    public EnableKill(b: bool)
    {
        this.killButton.interactable = b;
    }

    public EnableSabotage(b: bool)
    {
        this.sabotageButton.interactable = b;
    }
    
    public ActivateUse()
    {
        this.useButton.gameObject.SetActive(true);
        this.sabotageButton.gameObject.SetActive(false);
    }
    
    public ActivateSabotage()
    {
        this.useButton.gameObject.SetActive(false);
        this.sabotageButton.gameObject.SetActive(true);
    }
}