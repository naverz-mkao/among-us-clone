import { Time, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class CarScript extends ZepetoScriptBehaviour {
    public currentForwardPosition: number;
    public speed: number;
    public maxDistance: number;

    Start() {    
        this.currentForwardPosition = 0;
    }

    Update() {
        this.currentForwardPosition += this.speed * Time.deltaTime;
        this.transform.position += this.transform.forward * Time.deltaTime * this.speed;

        if (this.currentForwardPosition >= this.maxDistance) {
            this.currentForwardPosition = 0
            this.speed *= -1;
        }
        if (this.currentForwardPosition <= -this.maxDistance) {
            this.currentForwardPosition = 0
            this.speed *= -1;
        }
    }

}