import { Texture, Sprite, Texture2D, Vector2, Rect, GameObject, Debug } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldHelper } from 'ZEPETO.World';
import CharacterController from '../Character/CharacterController';
import Main from '../Main';
import {TextMeshProUGUI} from "TMPro";
import { PlayerTeam } from '../Game Management/GameManager';
import { Player } from 'ZEPETO.Multiplay.Schema';
import ClientScript from '../Game Management/Multiplay/ClientScript';

export default class UIVotingWinController extends ZepetoScriptBehaviour {
    public profileButtons: Button[];
    public confirmBtn: Button;
    public voteStatusText: TextMeshProUGUI;

    private currentVote: string;

    private lastHighlight: GameObject;
    private profiles: Map<string, Button> = new Map<string, Button>();

    private hasVoted: boolean = false;
    private isInitialized: boolean = false;
    
    public Awake() {
        this.confirmBtn.onClick.AddListener(() => {
            if (this.hasVoted) {
                return;
            }
            Main.instance.gameMgr.VoteForUser(this.currentVote);
            this.voteStatusText.text = "Voted for: " + ClientScript.GetInstance().GetUsername(this.currentVote);
            this.confirmBtn.gameObject.SetActive(false);
            this.hasVoted = true;
        });
    }

    public Show() {
        this.confirmBtn.gameObject.SetActive(false);
        this.lastHighlight = undefined;
        this.hasVoted = false;

        this.LoadProfiles(ClientScript.GetInstance().GetPlayerIDs());
        
        for (let i: number = 0; i < this.profileButtons.length; i++) {
            let btn = this.profileButtons[i];
            let highlight = btn.transform.Find("Highlight");
            highlight.gameObject.SetActive(false);

            let voteText: TextMeshProUGUI = btn.transform.Find("VoteCount").GetComponent<TextMeshProUGUI>();
            voteText.text = "0";
        }
    }

    public SetVoteStatus()
    {
        
    }
    
    public SetVoteCount(userId: string, value: number)
    {
        let btn: Button = this.profiles.get(userId);
        let voteText: TextMeshProUGUI = btn.transform.Find("VoteCount").GetComponent<TextMeshProUGUI>();
        voteText.text = value.toString();
    }
    
    public LoadProfiles(playerInfos: string[])
    {
        console.error("Loading " + playerInfos.length + " Profiles");
        let ccCount : number = playerInfos.length; 
        for (let i : number = 0; i < this.profileButtons.length; i++)
        {
            let btn = this.profileButtons[i];
            if (i >= ccCount) { btn.gameObject.SetActive(false); continue;}
            
            let playerInfo: Player = ClientScript.GetInstance().GetPlayer(playerInfos[i]);
            
            this.profiles.set(playerInfo.userId, btn);
            btn.gameObject.SetActive(true);
            btn.transform.Find("Name").GetComponent<TextMeshProUGUI>().text = ClientScript.GetInstance().GetUsername(playerInfo.userId);
            console.error("Assigned Profile for " + ClientScript.GetInstance().GetUsername(playerInfo.userId) + " on " + playerInfo.userId);

            let deadCover = btn.transform.Find("Dead");
            deadCover.gameObject.SetActive(playerInfo.team.teamId == PlayerTeam.GHOST);
            
            let index = i;
            ZepetoWorldHelper.GetProfileTexture(playerInfo.userId, (texture: Texture) => {
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
                    this.currentVote = playerInfo.userId;
                });
            }, (error) => {
                console.error(error);
            });
        }
    }
}