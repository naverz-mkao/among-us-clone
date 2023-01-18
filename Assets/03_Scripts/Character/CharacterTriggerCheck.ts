import { Collider } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import InteractibleObject from '../Interactibles/InteractibleObject';
import Main from '../Main';
import CharacterController from './CharacterController';

export default class CharacterTriggerCheck extends ZepetoScriptBehaviour {
    
    public OnTriggerEnter(other: Collider)
    {
        if (other.CompareTag("Interactible"))
        {
            let info = other.gameObject.GetComponent<InteractibleObject>();
            Main.instance.characterController.EnableInteraction(true, info);
        }
        
        if (other.CompareTag("Survivor"))
        {
            
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