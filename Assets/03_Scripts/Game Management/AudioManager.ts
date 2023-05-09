import { AudioClip, AudioSource } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class AudioManager extends ZepetoScriptBehaviour {
    @SerializeField() private audioClips: AudioClip[] = new Array<AudioClip>();
    @SerializeField() private globalSource: AudioSource;
    
    private audios: Map<string, AudioClip> = new Map<string, AudioClip>();
    
    public Start()
    {
        console.log(this.audioClips[0].name);
        
        this.audioClips.forEach((clip) => {
           this.audios.set(clip.name, clip); 
        });
    }
    
    public PlayAudio(name: string)
    {
        let clip : AudioClip = this.audios.get(name);
        
        this.globalSource.PlayOneShot(clip);
    }
}