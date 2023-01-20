import { Collider } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import InteractibleObject from '../Interactibles/InteractibleObject';
import Main from '../Main';
import CharacterController from './CharacterController';

export default class CharacterTriggerCheck extends ZepetoScriptBehaviour {
    public myCC : CharacterController;
    
    public Start()
    {
        this.myCC = Main.instance.characterController;
    }
    
    public OnTriggerEnter(other: Collider)
    {
        if (other.CompareTag("Interactible"))
        {
            let info = other.gameObject.GetComponent<InteractibleObject>();
            this.myCC.EnableInteraction(true, info);
        }
        
        if (other.CompareTag("Survivor") && this.myCC.IsVirus())
        {
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
    }

}