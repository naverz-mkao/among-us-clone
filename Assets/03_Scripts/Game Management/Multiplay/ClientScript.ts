import { GameObject, Quaternion, Vector3, WaitForSeconds, Transform } from 'UnityEngine';
import { CharacterState, SpawnInfo, ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room } from 'ZEPETO.Multiplay';
import { Player, State } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WorldService, ZepetoWorldMultiplay } from 'ZEPETO.World';
import Main from '../../Main';
import ClientMessageSender from './ClientMessageSender';

export enum MultiplayMessageType {

    // When position is synced
    CharacterTransform = "CharacterTransform",

    // For Animation states
    CharacterState = "CharacterState",
    
    //Initialize When the Game Starts
    InitializeGame = "InitializeGame"
}

//Transform position data
export type MultiplayMessageCharacterTransform = {
    positionX: number,
    positionY: number,
    positionZ: number,
}

//Character state data
export type MultiplayMessageCharacterState = {

    //state id number for translation to enum. 
    characterState: number
}

export type MultiplayMessageVirusInfo = {
    virusId: number,
    clientCount: number
}

export default class ClientScript extends ZepetoScriptBehaviour {
    private static instance: ClientScript;
    public static isInitializing: boolean = true;
    static GetInstance(): ClientScript {
        if (!ClientScript.instance) {
            const targetObj = GameObject.Find("Client");
            if (targetObj) ClientScript.instance = targetObj.GetComponent<ClientScript>();
        }
        return ClientScript.instance;
    }

    public multiplay: ZepetoWorldMultiplay;

    public multiplayRoom: Room;

    //Map of the players coming from the multiplay server. 
    public multiplayPlayers: Map<string, Player> = new Map<string, Player>();

    public objZepetoPlayers: ZepetoPlayers;
    
    public messageSender: ClientMessageSender = new ClientMessageSender();
    
    public connectedClients: number = 0;
    
    public Awake() {
        this.messageSender = new ClientMessageSender();
        this.messageSender.Init(this);
        ClientScript.isInitializing = true;
    }
    Start() { 
        //Cache the room in the Callback when the server creates a room object. 
        this.multiplay.RoomCreated += (room: Room) => {
            this.multiplayRoom = room;
            
        };

        //Callback for when the room is joined. 
        this.multiplay.RoomJoined += (room: Room) => {
            //Called each time the room state variables are altered
            room.OnStateChange += this.OnStateChange;

            this.multiplayRoom.AddMessageHandler(MultiplayMessageType.InitializeGame, (message: MultiplayMessageVirusInfo) => {
                console.log(`Initialized Game with virus ${message.virusId}`);
                Main.instance.InitializeWithVirus(message.virusId);
            });
        }

        GameObject.DontDestroyOnLoad(this.gameObject);
    }

    public Init()
    {
        
    }

    private OnStateChange(state: State, isFirst: boolean) {
        // Called for the first state change only
        if (isFirst) {
            // Apply sync logic for player if they already exist. 
            state.players.ForEach((userId, player) => { this.OnPlayerAdd(player, userId) });

            // Register Player Add/Remove events 
            state.players.add_OnAdd((player, userId) => { this.OnPlayerAdd(player, userId) });
            state.players.add_OnRemove((player, userId) => { this.OnPlayerRemove(player, userId) });

            this.InitializeCharacter(state);
        }
    }

    private OnPlayerAdd(player: Player, userId: string) {
        if (this.multiplayPlayers.has(userId)) return;

        // Cache the player to our map 
        this.multiplayPlayers.set(userId, player);

        //Create spawn info for our new character. 
        const spawnInfo = new SpawnInfo();
        const transformInfo : Transform = Main.instance.GetSpawnTransform();
        console.log(transformInfo.gameObject.name);
        spawnInfo.position = transformInfo.position;
        spawnInfo.rotation = transformInfo.rotation;

        // If the added player id matches the world service id, we know this is the local player. 
        const isLocal = WorldService.userId === userId;
        
       // Main.instance.AddSpawn(userId);
        
        if (isLocal)
        {
            ClientScript.isInitializing = false;
        }
        
        // Instantiate character with the above settings. 
        ZepetoPlayers.instance.CreatePlayerWithUserId(userId, userId, spawnInfo, isLocal);
    }

    
    private OnPlayerRemove(player: Player, userId: string) {
        if (!this.multiplayPlayers.has(userId)) return;
        ZepetoPlayers.instance.RemovePlayer(userId);
        Main.instance.RemoveSpawn(userId);
    }

    private InitializeCharacter(state: State) {
        // Callback when the localplayer is fully loaded into the scene.
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            // cache the player and userIds
            const zepetoPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
            const userId = WorldService.userId;

            zepetoPlayer.character.gameObject.layer = 5;

            // Change the character's name to the userID
            zepetoPlayer.character.name = userId;

            // Send a message to the server every time the character state is altered. 
            zepetoPlayer.character.OnChangedState.AddListener((current, previous) => {
                this.SendMessageCharacterState(current);
            });

            // Check the character transform positions every 0.1 seconds and update. 
            this.StartCoroutine(this.SendMessageCharacterTransformLoop(0.1));
        });

        // Callback when the player is fully loaded into the scene. 
        ZepetoPlayers.instance.OnAddedPlayer.AddListener((userId: string) => {
            //Cache the player by userId
            const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(userId);

            // Set the character object's name to the userId
            zepetoPlayer.character.name = userId;

            //Grab the player instance from the server schema map based on the userId
            const player: Player = this.multiplayRoom.State.players.get_Item(userId);

            // Add to the OnChange Schema Type Callback Message
            player.position.OnChange += () => {

                // Only sync for everyone but the local player
                if (zepetoPlayer.isLocalPlayer == false) {

                    // Cache the postion values. 
                    const x = player.position.x;
                    const y = player.position.y;
                    const z = player.position.z;
                    const position = new Vector3(x, y, z);

                    // Directly apply the server position if the position deviates past a certain range (Handle sync issues)
                    if (Vector3.Distance(position, zepetoPlayer.character.transform.position) > 7) {
                        zepetoPlayer.character.transform.position = position;
                    }

                    // Move the character to the target position. 
                    zepetoPlayer.character.MoveToPosition(position);

                    //Jump if the character state has changed to jump. 
                    if (player.characterState === CharacterState.JumpIdle || player.characterState === CharacterState.JumpMove)
                        zepetoPlayer.character.Jump();
                }
            }
        });
    }

    //Message Sending Functions
    public SendMessageCharacterState(characterState: CharacterState) {
        // Create the character state message body. 
        const message: MultiplayMessageCharacterState = {
            characterState: characterState
        }

        // Send the character state. 
        this.multiplayRoom.Send(MultiplayMessageType.CharacterState, message);
    }

    public *SendMessageCharacterTransformLoop(tick: number) {
        while (true) {

            // Wait For the designated amount of time (tick)
            yield new WaitForSeconds(tick);

            // Only run if the multiplay room instance exists and the room is connected. 
            if (this.multiplayRoom != null && this.multiplayRoom.IsConnected) {

                // Cache the userId. 
                const userId = WorldService.userId;

                // Only run if the player exists in the zepeto players map. 
                if (ZepetoPlayers.instance.HasPlayer(userId)) {

                    //Cache the character controller. 
                    const character = ZepetoPlayers.instance.GetPlayer(userId).character;

                    // Send the character transform update message if not idling. (Send when character moves/jumps)
                    if (character.CurrentState != CharacterState.Idle)
                        this.SendMessageCharacterTransform(character.transform);
                }
            }
        }
    }

    public SendMessageCharacterTransform(transform: Transform) {
        //Cache the local transform position. 
        const position = transform.localPosition;

        // Create the message body 
        const message: MultiplayMessageCharacterTransform = {
            positionX: position.x,
            positionY: position.y,
            positionZ: position.z
        }

        // Send the message to the server. 
        this.multiplayRoom.Send(MultiplayMessageType.CharacterTransform, message);
    }

    public SendMessageInitializeGame()
    {
        const clientCount = this.multiplayPlayers.size;
        let message : MultiplayMessageVirusInfo = {
            virusId : 1,
            clientCount : clientCount
        }
        
        console.log(`Initializing Game ${MultiplayMessageType.InitializeGame}: Virus(${message.virusId}, ${message.clientCount})`);
        this.multiplayRoom.Send(MultiplayMessageType.InitializeGame, message);
    }
}
