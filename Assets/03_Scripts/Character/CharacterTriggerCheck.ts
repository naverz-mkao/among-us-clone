import { Transform, Vector3, Collider, Color, GameObject, Renderer } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import InteractibleObject from '../Interactibles/InteractibleObject';
import Main from '../Main';
import CharacterController from './CharacterController';

export default class CharacterTriggerCheck extends ZepetoScriptBehaviour {
    public triggerObject: Transform;
    
    public myCC : CharacterController;
    
    public Start()
    {
        this.myCC = Main.instance.characterController;
    }
    
    public OnTriggerEnter(other: Collider)
    {
        console.error(`Trigger Activated ${other.gameObject.name} ${other.gameObject.tag} ${this.myCC.gameObject.tag} ${this.myCC.IsVirus()}`);
        if (other.CompareTag("Interactible"))
        {
            let info = other.gameObject.GetComponent<InteractibleObject>();
            this.myCC.EnableInteraction(true, info);
        }
        
        if (other.CompareTag("Survivor") && this.myCC.IsVirus())
        {
            this.triggerObject.localScale = Vector3.one * 3;
            this.myCC.AddTarget(other.gameObject.name);
        }
        
        if (other.CompareTag("Virus"))
        {
            
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
            this.triggerObject.localScale = Vector3.one * 1.5;
        }
    }

}