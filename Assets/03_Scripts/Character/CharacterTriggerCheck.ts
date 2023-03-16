import { Transform, Vector3, Collider, Color, GameObject, Renderer } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import InteractibleObject from '../Interactibles/InteractibleObject';
import Main from '../Main';
import CharacterController from './CharacterController';

export default class CharacterTriggerCheck extends ZepetoScriptBehaviour {
    
    public myCC : CharacterController;
    
    
    private myCol : Collider;
    public Start()
    {
        this.myCC = Main.instance.characterController;
        this.myCol = this.GetComponent<Collider>();
    }
    
    public OnTriggerEnter(other: Collider)
    {
        console.log(other.gameObject.name + "|" + other.gameObject.tag);
        if (other.gameObject.tag == "Interactible")
        {
            let info = other.gameObject.GetComponent<InteractibleObject>();
            this.myCC.EnableInteraction(true, info);
        }
        
        if (other.gameObject.tag == "Survivor" && this.myCC.IsVirus())
        {
            this.myCC.AddTarget(other.gameObject.name);
        }
        
        if (other.gameObject.tag == "Virus")
        {
            
        }

        if (other.gameObject.tag == "Respawn")
        {
            this.myCC.ResetPosition();
        }
    }
    
    public OnTriggerExit(other: Collider)
    {
        if (other.CompareTag("Interactible"))
        {
            let info = other.gameObject.GetComponent<InteractibleObject>();
            Main.instance.characterController.EnableInteraction(false, info);
        }

        if (other.CompareTag("Survivor") && this.myCC.IsVirus())
        {
            this.myCC.RemoveTarget(other.gameObject.name);
        }
    }

}