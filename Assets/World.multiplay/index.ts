import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { Player, Vector3Schema } from "ZEPETO.Multiplay.Schema";

enum MultiplayMessageType {

    // When position is synced
    CharacterTransform = "CharacterTransform",

    // For Animation states
    CharacterState = "CharacterState",
    
    ClientReady = "ClientReady",
    
    // Set Team
    UpdateTeam = "SetTeam",
    //Call Meeting
    CallMeeting = "CallMeeting",
    //Meeting Finished
    MeetingFinished = "MeetingFinished",

    //Game States
    Waiting = "Waiting",

    GameReady = "GameReady",

    GameStart = "GameStart",

    GameFinish = "GameFinish",

    Result = "Result",
};

//Transform position data
type MultiplayMessageCharacterTransform = {
    positionX: number,
    positionY: number,
    positionZ: number,
};

//Character state data
type MultiplayMessageCharacterState = {

    //state id number for translation to enum. 
    characterState: number
};

type MultiplayMessageCharacterTeam = {

    //state id number for translation to enum. 
    userId: string,
    teamId: number
};

type MultiplayMessageWaiting = {
    minClients: number
}

type MultiplayMessageGameReady = {
    virusId: string
}


type MultiplayMessageGameStart = {

}


type MultiplayMessageGameFinish = {

}


type MultiplayMessageResult = {

}

type MultiplayMessageClientReady = {

}

type MultiplayMessageCallMeeting = {

}

type MultiplayMessageMeetingFinished = {

}

enum GameState {
    
    //Waiting for enough users to begin the game
    Wait,

    //Enough players have been found, game is ready to begin.
    GameReady,

    //All Players loaded. Game is in progress
    GameStart,

    //Winner has been decided. Game is over
    GameFinish,
    
    MeetingTimer,

    //Game has finished and the results are shown. 
    Result
}

export default class extends Sandbox {
    private gameState = GameState.Wait;
    
    //The minimum number of players required to begin the game. 
    private readonly gameStartCount = 3;

    //To track the current connected players
    private currentPlayerCount: number = 0;

    //Time elapsed since game start. 
    private gameTime: number = 0;
    
    private readonly timerDuration: number = 30 * 1000;

    //The duration that the result window will be open before restarting the game. 
    private readonly resultDuration: number = 10 * 1000;

    //The time since game start. 
    private resultTime: number = 0;
    
    private virusID: string = "";
    
    private openSpawnIndices: boolean[];
    onCreate(options: SandboxOptions) {
        this.openSpawnIndices = new Array(this.maxClients);
        
        // Position Sync Message
        this.onMessage(MultiplayMessageType.CharacterTransform, (client, message: MultiplayMessageCharacterTransform) => {
            // Only continue if the player exists based on the userId
            const userId = client.userId;
            if (!this.state.players.has(userId)) return;

            // Grab the player based on userId
            const player = this.state.players.get(userId);
            // Sync Position Data
            const position = new Vector3Schema();
            position.x = message.positionX;
            position.y = message.positionY;
            position.z = message.positionZ;

            player.position = position;
        });

        // Character State (Jumping, running etc) sync message
        this.onMessage(MultiplayMessageType.CharacterState, (client, message: MultiplayMessageCharacterState) => {
            const player = this.state.players.get(client.userId);
            player.characterState = message.characterState;
        });

        this.onMessage<MultiplayMessageClientReady>(MultiplayMessageType.ClientReady, (client, message: MultiplayMessageClientReady) => {
            console.log("Player " + client.userId + " is Ready");
            this.currentPlayerCount++;
        });
        
        this.onMessage<MultiplayMessageCharacterTeam>(MultiplayMessageType.UpdateTeam, (client, message: MultiplayMessageCharacterTeam) => {
            // let info : MultiplayMessageCharacterTeam = {
            //     userId: client.userId,
            //     teamId: message.teamId
            // }

            const player = this.state.players.get(message.userId);
            player.team.teamId = message.teamId;
            
            console.log(`Updated team for user ${message.userId} to ${message.userId}`);
            
            //Send Change team message to all client except original sender.
            //this.broadcast(MultiplayMessageType.UpdateTeam, info, {except : client});
        });

        this.onMessage<MultiplayMessageCallMeeting>(MultiplayMessageType.CallMeeting, (client, message: MultiplayMessageCallMeeting) => {
            console.log("Calling Town Meeting");
            this.SetGameState(GameState.MeetingTimer);
        });
    }

    //Get the next available spawn transform index.
    GetOpenSpawnIndex(fromIndex : number): number
    {
        let spawnIndex: number = fromIndex;
        for (let i = 0; i < this.maxClients; i++)
        {
            if (!this.openSpawnIndices[spawnIndex]) {break;}
            spawnIndex = (fromIndex + 1) % this.maxClients;
        }
        
        this.openSpawnIndices[spawnIndex] = true;
        return spawnIndex;
    }
    
    onJoin(client: SandboxPlayer) {
        const userId = client.userId;
        const player = new Player();
        
        // Apply the schema userID value to the player object. 
        player.userId = userId;

        // Apply the schema's position data to our copy
        player.position = new Vector3Schema();

        // Reset position to (0,0,0)
        player.position.x = 0;
        player.position.y = 0;
        player.position.z = 0;
        
        //Get the next available spawn transform index
        player.spawnIndex = this.GetOpenSpawnIndex(this.state.players.size);
        
        //Cache our player to the map. 
        this.state.players.set(userId, player);
        console.log(`Began Waiting.. ${this.state.players.size}/${this.gameStartCount}`);
        
    }

    onLeave(client: SandboxPlayer, consented?: boolean) {
        //Unset the flag for the players spawn transform index
        this.openSpawnIndices[this.state.players.get(client.userId).spawnIndex] = false;
        
        // Delete the player data
        this.state.players.delete(client.userId);
        
        //TODO: Check if the player that left is a virus. If yes, trigger survivor victory.
    }

    onTick(deltaTime: number): void {
        this.UpdateWait(deltaTime);
        this.UpdateResult(deltaTime);
        this.UpdateMeetingTimer(deltaTime);
    }

    InitializeWait()
    {
        // Elapsed Time since start
        this.gameTime = 0;
        // Send Waiting state message to clients
        this.SendMessageWaiting();
    }

    InitializeGame()
    {
        this.gameTime = 0;
        
        //Send a message to the clients that the game is beginning. 
        this.SendMessageGameStart();
    }
    
    InitializeMeetingTimer()
    {
        this.state.gameTimer.value = 0;
        
        this.SendMessageMeetingTimer();
    }

    InitializeResult()
    {
        this.resultTime = 0;
        this.SendMessageResult();
    }

    UpdateWait(deltaTime: number) {
        // Don't perform any actions if the game state isn't wait. 
        if (this.gameState != GameState.Wait) return;

        // cache the current player count. 
        //this.currentPlayerCount = this.state.players.size;

        // Check if there are enough players to start the game. 
        if (this.currentPlayerCount >= this.gameStartCount) {
            // If the game hasn't yet started, send the gameready state to the clients. 
            if (this.gameTime == 0) this.SendMessageGameReady();

            this.gameTime += deltaTime;

            // Start the game after 4 seconds (4000 milliseconds)
            if (this.gameTime >= 4000) this.SetGameState(GameState.GameStart);
        }
    }

    UpdateMeetingTimer(deltaTime: number) {
        // Don't execute code if the current state is not game. 
        if (this.gameState != GameState.MeetingTimer) return;

        // Count the gametime by the deltaTime. 
        this.gameTime += deltaTime;

        // timer calculation
        // (Duration - elapsed)
        // (3000 + 1000) - (101.. 1021.. 2025.. 3032..)
        // Math.floor(): drop off the decimals. 
        // The reason why we add +1000(+1second): When performing a Math.floor(), the timer will reach 0 even if we 
        // decrease 1 by 0.1 (Math.floor(0.9) == 0). We add 1000 ms to start the count from duration + 1 for this reason. 
        // Why we multiply by .001: To convert milliseconds to seconds. 
        this.state.gameTimer.value = Math.floor(((this.timerDuration + 1000) - this.gameTime) * 0.001);

        // Check if the timer reached 0. 
        if (this.state.gameTimer.value == 0) this.SendMessageMeetingFinished();

        //After sending the finish message, wait 3 seconds, and show the result. 
        if (this.gameTime >= this.timerDuration + (3 * 1000)) this.SetGameState(GameState.GameStart);
    }

    UpdateResult(deltaTime: number) {
        if (this.gameState != GameState.Result) return;
        this.resultTime += deltaTime;

        if (this.resultTime >= this.resultDuration) this.SetGameState(GameState.Wait);
    }

    //apply the given game state
    SetGameState(gameState: GameState) {
        this.gameState = gameState;

        //Initialize the corresponding game state. 
        switch (gameState) {
            case GameState.Wait: this.InitializeWait(); break;
            case GameState.GameStart: this.InitializeGame(); break;
            case GameState.MeetingTimer: this.InitializeMeetingTimer(); break;
            case GameState.Result: this.InitializeResult(); break;
        }
    }

    SendMessageWaiting() {
        const message: MultiplayMessageWaiting = {
            minClients: this.gameStartCount
        };

        //console.log(`Began Waiting.. ${this.state.players.size}/${this.gameStartCount}`);
        console.log("Waiting..");
        this.broadcast(MultiplayMessageType.Waiting, message);
    }

    SendMessageGameReady() {
        
        //Assign the virus player
        let randIndex: number = Math.floor(Math.random() * this.state.players.size);
        let userID = Array.from(this.state.players.keys())[randIndex];
        this.virusID = this.state.players.get(userID).userId;
        
        const message: MultiplayMessageGameReady = {
            virusId: this.virusID
        };

        console.log("Game Ready..");
        console.log(`Player ${message.virusId} is the virus`);
        this.broadcast(MultiplayMessageType.GameReady, message);
    }

    SendMessageGameStart() {
        const message: MultiplayMessageGameStart = {};
        console.log("Game Start..");
        this.broadcast(MultiplayMessageType.GameStart, message);
    }

    SendMessageMeetingTimer() {
        const message: MultiplayMessageCallMeeting = {};
        console.log("Game Start..");
        this.broadcast(MultiplayMessageType.CallMeeting, message);
    }

    SendMessageGameFinish() {
        const message: MultiplayMessageGameFinish = {};
        console.log("Game Finish..");
        this.broadcast(MultiplayMessageType.GameFinish, message);
    }

    SendMessageResult() {
        const message: MultiplayMessageResult = {};
        this.broadcast(MultiplayMessageType.Result, message);
    }

    SendMessageMeetingFinished() {
        const message: MultiplayMessageMeetingFinished = {};
        this.broadcast(MultiplayMessageType.MeetingFinished, message);
    }
}
