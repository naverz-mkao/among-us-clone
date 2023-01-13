import {RectTransform, RectTransformUtility, Vector2 } from 'UnityEngine';
import {IDragHandler, PointerEventData } from 'UnityEngine.EventSystems';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class UITouchpad extends ZepetoScriptBehaviour implements IDragHandler{
    @SerializeField()
    private m_MovementRange: number = 100;
    
    private m_pointerDownPos: Vector2;
    private rect: RectTransform;
    
    public Awake()
    {
        this.rect = this.GetComponent<RectTransform>();    
    }
    
    public OnDrag(eventData: PointerEventData): void
    {
        console.log(`Drag Event: $eventData.delta}`)
        let position: $Ref<Vector2>;
        if (!RectTransformUtility.ScreenPointToLocalPointInRectangle(this.rect, eventData.position, eventData.pressEventCamera, position))
            return;

        let vector2: Vector2 = Vector2.ClampMagnitude($unref(position) - this.m_pointerDownPos, this.m_MovementRange);
        let final: Vector2 = new Vector2(vector2.x / this.m_MovementRange, vector2.y / this.m_MovementRange);
        console.log(`Drag Event: $eventData.delta}`)
        //this.OnDragEvent?.Invoke({new Vector2(vector2.x / this.m_MovementRange, vector2.y / this.m_MovementRange));
    }
}