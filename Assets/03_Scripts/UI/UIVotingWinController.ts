import { Texture, Sprite, Texture2D, Vector2, Rect, GameObject, Debug } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldHelper } from 'ZEPETO.World';
import CharacterController from '../Character/CharacterController';
import Main from '../Main';
import {TextMeshProUGUI} from "TMPro";

export default class UIVotingWinController extends ZepetoScriptBehaviour {
    public profileButtons: Button[];
    public confirmBtn: Button;
    
    private currentVote: string;
    
    private lastHighlight : GameObject;
    private profiles : Map<string, Button> = new Map<string, Button>();
    
    private hasVoted: boolean = false;
    
    public Awake()
    {
        this.confirmBtn.onClick.AddListener(() => {
           if (this.hasVoted) { return; }
           Main.instance.gameMgr.VoteForUser(this.currentVote);
           this.confirmBtn.gameObject.SetActive(false);
           this.hasVoted = true;
        });
    }
    
    public Show()
    {
        this.confirmBtn.gameObject.SetActive(false);
        this.lastHighlight = undefined;
        this.hasVoted = false;
        
        for (let i : number = 0; i < this.profileButtons.length; i++)
        {
            let btn = this.profileButtons[i];
            let highlight = btn.transform.Find("Highlight");
            highlight.gameObject.SetActive(false);
            
            let voteText: TextMeshProUGUI = btn.transform.Find("VoteCount").GetComponent<TextMeshProUGUI>();
            voteText.text = "0";
        }
    }
    
    public SetVoteCount(userId: string, value: number)
    {
        let btn: Button = this.profiles.get(userId);
        let voteText: TextMeshProUGUI = btn.transform.Find("VoteCount").GetComponent<TextMeshProUGUI>();
        voteText.text = value.toString();
    }
    
    public LoadProfiles(playerCCs: CharacterController[])
    {
        let ccCount : number = playerCCs.length; 
        for (let i : number = 0; i < this.profileButtons.length; i++)
        {
            let btn = this.profileButtons[i];
            if (i >= ccCount) { btn.gameObject.SetActive(false); continue;}
            
            let cc: CharacterController = playerCCs[i];
            
            this.profiles.set(cc.playerInfo.userId, btn);
            btn.gameObject.SetActive(true);

            let index = i;
            ZepetoWorldHelper.GetProfileTexture(cc.playerInfo.userId, (texture: Texture) => {
                let rect: Rect = new Rect(0, 0, texture.width, texture.height);
                btn.image.sprite = Sprite.Create(texture as Texture2D, rect, new Vector2(0.5, 0.5));
                
                btn.onClick.AddListener(() =>{
                    if (this.hasVoted) { return; }
                    
                    this.confirmBtn.gameObject.SetActive(true);
                    let highlight = btn.transform.Find("Highlight");
                    
                    if (this.lastHighlight != undefined)
                    {
                        this.lastHighlight.SetActive(false);
                    }
                    
                    highlight.gameObject.SetActive(!highlight.gameObject.activeSelf);
                    this.lastHighlight = highlight.gameObject;
                    this.currentVote = cc.playerInfo.userId;
                });
            }, (error) => {
                console.error(error);
            });
        }
    }
}