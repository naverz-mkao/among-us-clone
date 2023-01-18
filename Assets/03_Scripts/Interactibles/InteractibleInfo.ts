export enum InteractionEvent
{
    MINIGAME_BUTTONCLICKER = 0,
    MEETING_HALL = 1,
    MEETING_REPORTBODY = 2
}

export default class InteractibleInfo {
    public event: InteractionEvent;
    
}