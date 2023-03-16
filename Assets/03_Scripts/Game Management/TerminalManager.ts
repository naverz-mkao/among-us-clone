import { GameObject, Material, Renderer } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ClientScript from './Multiplay/ClientScript';

export default class TerminalManager extends ZepetoScriptBehaviour {
    public terminals : GameObject[];
    public idleMat: Material;
    public interactedMat: Material;
    
    private hasInteracted: boolean[];
    
    public Start()
    {
        this.hasInteracted = new Array(this.terminals.length);
        for(let i = 0; i < this.terminals.length; i++)
        {
            this.terminals[i].gameObject.name = "Terminal_" + i;
        }
        
        this.ResetAllTerminals();
    }
    
    public ResetAllTerminals()
    {
        for(let i = 0; i < this.terminals.length; i++)
        {
            this.terminals[i].transform.Find("Screen").GetComponent<Renderer>().material = this.idleMat;
            this.hasInteracted[i] = false;
        }
    }
    
    public InteractWithTerminal(index: number)
    {
        if (this.hasInteracted[index]) { return; }
        
        this.terminals[index].transform.Find("Screen").GetComponent<Renderer>().material = this.interactedMat;
        this.hasInteracted[index] = true;
        ClientScript.GetInstance().SendMessageCompleteTask();
    }
}