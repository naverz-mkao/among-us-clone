import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { Player, Vector3Schema } from "ZEPETO.Multiplay.Schema";

enum MultiplayMessageType {

    // When position is synced
    CharacterTransform = "CharacterTransform",

    // For Animation states
    CharacterState = "CharacterState",

    // Initialize When the Game Starts
    InitializeGame = "InitializeGame",
    
    // Set Team
    UpdateTeam = "SetTeam",

    //Game States
    Waiting = "Waiting",

    GameReady = "GameReady",

    GameStart = "GameStart",

    GameFinish = "GameFinish",

    Result = "Result"
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

type MultiplayMessageInitializeCharacter = {
    virusId: number,
    clientCount: number
}

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

enum GameState {

    //Waiting for enough users to begin the game
    Wait,

    //Enough players have been found, game is in progress.
    Game,

    //Game has finished and the results are shown. 
    Result
}

export default class extends Sandbox {
    private gameState = GameState.Wait;
    
    //The minimum number of players required to begin the game. 
    private readonly gameStartCount = 2;

    //To track the current connected players
    private currentPlayerCount: number = 0;

    //Time elapsed since game start. 
    private gameTime: number = 0;

    //The duration that the result window will be open before restarting the game. 
    private readonly resultDuration: number = 10 * 1000;

    //The time since game start. 
    private resultTime: number = 0;
    
    private virusID: string = "";
    onCreate(options: SandboxOptions) {
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
        
        this.onMessage<MultiplayMessageInitializeCharacter>(MultiplayMessageType.InitializeGame, (client, message: MultiplayMessageInitializeCharacter) => {
            let info : MultiplayMessageInitializeCharacter = {
                virusId: Math.floor(Math.random() * message.clientCount),
                clientCount: message.clientCount
            }
            
            this.broadcast(MultiplayMessageType.InitializeGame, info); 
        });
        
        this.onMessage<MultiplayMessageCharacterTeam>(MultiplayMessageType.UpdateTeam, (client, message: MultiplayMessageCharacterTeam) => {
            // let info : MultiplayMessageCharacterTeam = {
            //     userId: client.userId,
            //     teamId: message.teamId
            // }

            const player = this.state.players.get(client.userId);
            player.team.teamId = message.teamId;
            
            //Send Change team message to all client except original sender.
            //this.broadcast(MultiplayMessageType.UpdateTeam, info, {except : client});
        })
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
        
        //Cache our player to the map. 
        this.state.players.set(userId, player);
        console.log(`Began Waiting.. ${this.state.players.size}/${this.gameStartCount}`);
        
    }

    onLeave(client: SandboxPlayer, consented?: boolean) {
        // Delete the player data
        this.state.players.delete(client.userId);
    }

    onTick(deltaTime: number): void {
        this.UpdateWait(deltaTime);
        this.UpdateResult(deltaTime);
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
        
        //Assign the virus player
        let randIndex: number = Math.floor(Math.random() * this.state.players.size);
        let userID = Array.from(this.state.players.keys())[randIndex];
        this.virusID = this.state.players.get(userID).userId;
        
        //Send a message to the clients that the game is beginning. 
        this.SendMessageGameStart();
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
        this.currentPlayerCount = this.state.players.size;

        // Check if there are enough players to start the game. 
        if (this.currentPlayerCount == this.gameStartCount) {
            // If the game hasn't yet started, send the gameready state to the clients. 
            if (this.gameTime == 0) this.SendMessageGameReady();

            this.gameTime += deltaTime;

            // Start the game after 4 seconds (4000 milliseconds)
            if (this.gameTime >= 4000) this.SetGameState(GameState.Game);
        }
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
            case GameState.Game: this.InitializeGame(); break;
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
        const message: MultiplayMessageGameReady = {
            virusId: this.virusID
        };

        console.log("Game Ready..");
        this.broadcast(MultiplayMessageType.GameReady, message);
    }

    SendMessageGameStart() {
        const message: MultiplayMessageGameStart = {};
        console.log("Game Start..");
        this.broadcast(MultiplayMessageType.GameStart, message);
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
}
