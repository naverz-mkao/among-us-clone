import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { Player, Vector3Schema, Vote } from "ZEPETO.Multiplay.Schema";

enum MultiplayMessageType {

    // When position is synced
    CharacterTransform = "CharacterTransform",

    // For Animation states
    CharacterState = "CharacterState",
    
    ClientReady = "ClientReady",
    // When the virus kills a player. 
    KillPlayer = "KillPlayer",
    // Set Team
    UpdateTeam = "SetTeam",

    //Call Meeting
    CallMeeting = "CallMeeting",
    //Meeting Finished
    MeetingFinished = "MeetingFinished",
    //Vote For Virus
    VoteForVirus = "VoteForVirus",
    //Complete Task
    CompleteTask = "CompleteTask",
    
    // Room Lock/Unlock States
    LockRoom = "LockRoom",
    UnlockRoom = "UnlockRoom",

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

type MultiplayMessageKillPlayer = {
    virusId: string,
    targetId: string,
    teamId: number
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
    winningTeam : number
}

type MultiplayMessageClientReady = {

}

type MultiplayMessageCallMeeting = {
    messageBody: string;
}

type MultiplayMessageVoteForVirus = {
    userId: string,
    count: number
}

type MultiplayMessageMeetingFinished = {
    userId: string
}

type MultiplayMessageCompleteTask = {

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
    private readonly gameStartCount = 2;

    //To track the current connected players
    private currentPlayerCount: number = 0;

    //To track the number of players fully loaded and ready. 
    // This should be number of players ^ 2 so all players are loaded on all clients.
    private currentReadyCount: number = 0;

    //Time elapsed since game start. 
    private gameTime: number = 0;

    private readonly waitTimerDuration: number = 30 * 1000;
    
    private readonly timerDuration: number = 30 * 1000;

    //The duration that the result window will be open before restarting the game. 
    private readonly resultDuration: number = 10 * 1000;

    //The time since game start. 
    private resultTime: number = 0;
    
    private openSpawnIndices: boolean[];
    
    private tasksPerPlayer: number = 5;
    private taskCompletionVictoryLimit: number = 0;
    private taskCurrentProgress = 0;
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
            console.log(`Client Ready: ${client.userId}`);
            this.currentReadyCount++;
        });
        
        this.onMessage<MultiplayMessageCharacterTeam>(MultiplayMessageType.UpdateTeam, (client, message: MultiplayMessageCharacterTeam) => {
            const player = this.state.players.get(message.userId);
            player.team.teamId = message.teamId;
            
            console.log(`Updated team for user ${message.userId} to ${message.userId}`);
            
            this.CheckWinner();
        });

        this.onMessage<MultiplayMessageKillPlayer>(MultiplayMessageType.KillPlayer, (client, message: MultiplayMessageKillPlayer) => {
            const player = this.state.players.get(message.targetId);
            player.team.teamId = message.teamId;

            console.log(`User ${message.virusId} killed ${message.targetId}. Changed to team ${message.teamId}`);

            this.CheckWinner();
            
            this.broadcast(MultiplayMessageType.KillPlayer, message);
        });

        this.onMessage<MultiplayMessageCallMeeting>(MultiplayMessageType.LockRoom, (client, message: MultiplayMessageCallMeeting) => {
            this.lock();
        });

        this.onMessage<MultiplayMessageCallMeeting>(MultiplayMessageType.UnlockRoom, (client, message: MultiplayMessageCallMeeting) => {
            this.unlock();
        });

        this.onMessage<MultiplayMessageCallMeeting>(MultiplayMessageType.CallMeeting, (client, message: MultiplayMessageCallMeeting) => {
            console.log("Calling Town Meeting");
            this.SendMessageMeetingTimer(message.messageBody);
            this.SetGameState(GameState.MeetingTimer);
        });

        this.onMessage<MultiplayMessageVoteForVirus>(MultiplayMessageType.VoteForVirus, (client, message: MultiplayMessageVoteForVirus) => {
            message.count = 0;
            if (this.state.votes.has(message.userId))
            {
                message.count = this.state.votes.get(message.userId).value;
            }
            
            let vote: Vote = new Vote();
            vote.value = message.count + 1;
            message.count = vote.value;
            this.state.votes.set(message.userId, vote);
            this.broadcast(MultiplayMessageType.VoteForVirus, message);
        });

        this.onMessage<MultiplayMessageCompleteTask>(MultiplayMessageType.CompleteTask, (client, message: MultiplayMessageCompleteTask) => {
            this.taskCurrentProgress++;
            this.CheckWinner();
        });
    }
    
    CheckWinner()
    {
        let virusCount : number = 0;
        let survivorCount : number = 0;
        
        //Survivor Win Condition
        console.log(`Tasks: ${this.taskCurrentProgress} Completion: ${this.taskCompletionVictoryLimit}`);
        if (this.taskCurrentProgress > this.taskCompletionVictoryLimit)
        {
            this.SendMessageResult(1);
        }
        
        //Virus Win Condition
        this.state.players.forEach((value: Player, key: string) =>{
            if (value.team.teamId == 0)
                virusCount++;
            else if (value.team.teamId == 1)
                survivorCount++;
        });
        
        console.log(`Virus: ${virusCount} Survivor: ${survivorCount}`);
        if (virusCount >= survivorCount)
        {
            this.SendMessageResult(0);
        }
    }
    
    GetHighestVotes(): string
    {
        //Make sure at least half of the players vote this person out. 
        let highestVoteCount : number = this.currentPlayerCount / 2; 
        let finalId: string = "NONE";
        this.state.votes.forEach((value: Vote, key: string) =>{
            console.log(`User [${key}]: ${value.value} Votes / ${this.currentPlayerCount}`);
            if (value.value >= highestVoteCount)
            {
                finalId = key;
            }
        });
        
        return finalId;
    }
    
    ResetRoles()
    {
        this.state.players.forEach((value: Player, key: string) =>{
            value.team.teamId = 3;
            value.isReady = false;
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
    
    AssignVirus(virusId: string)
    {
        this.state.players.forEach((value: Player, key: string) => {
            value.team.teamId = (value.userId == virusId) ? 0 : 1;
        });
    }
    
    SetTasks()
    {
        this.taskCurrentProgress = 0;
        this.taskCompletionVictoryLimit = Math.floor(((this.state.players.size - 1) * this.tasksPerPlayer) * 0.8);
    }
    
    onJoin(client: SandboxPlayer) {
        const userId = client.userId;
        const player = new Player();
        
        // Apply the schema userID value to the player object. 
        player.userId = userId;
        player.team.teamId = 3; //Set to Ghost Team

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
        this.currentPlayerCount++;
        console.log(`Began Waiting.. ${this.state.players.size}/${this.gameStartCount}`);
    }

    onLeave(client: SandboxPlayer, consented?: boolean) {
        //Unset the flag for the players spawn transform index
        this.openSpawnIndices[this.state.players.get(client.userId).spawnIndex] = false;
        
        // Delete the player data
        this.state.players.delete(client.userId);
        console.log("Players Deleted: " + client.userId);
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
        this.state.gameTimer.value = this.waitTimerDuration;
        this.ResetRoles();
        // Send Waiting state message to clients
        this.SendMessageWaiting();
    }

    InitializeGame()
    {
        this.gameTime = 0;
        this.state.gameTimer.value = 0;
        
        
        //Send a message to the clients that the game is beginning. 
        this.SendMessageGameStart();
    }

    InitializeMeetingTimer()
    {
        this.gameTime = 0;
        this.state.gameTimer.value = this.timerDuration;
        this.state.votes.clear();
    }

    InitializeResult()
    {
        this.resultTime = 0;
    }

    UpdateWait(deltaTime: number) {
        // Don't perform any actions if the game state isn't wait. 
        if (this.gameState != GameState.Wait) return;
        
        // Check if there are enough players to start the game. 
        if (this.currentPlayerCount >= this.gameStartCount && this.currentReadyCount >= (this.currentPlayerCount * this.currentPlayerCount)) {
            this.gameTime += deltaTime;
            this.state.gameTimer.value = Math.floor(((this.waitTimerDuration + 1000) - this.gameTime) * 0.001);
            if (this.state.gameTimer.value == 0)
            {
                this.SendMessageGameReady();
                this.SetGameState(GameState.GameStart);
            }
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
        if (this.gameTime >= this.timerDuration + (3 * 1000)) this.gameState = GameState.GameStart; //this.SetGameState(GameState.GameStart);
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
        this.state.virusId = this.state.players.get(userID).userId;
        
        const message: MultiplayMessageGameReady = {
            virusId: this.state.virusId
        };
        
        this.AssignVirus(this.state.virusId);
        
        this.SetTasks();

        console.log("Game Ready..");
        console.log(`Player ${message.virusId} is the virus`);
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

    SendMessageResult(winningTeam: number) {
        const message: MultiplayMessageResult = 
        {
            winningTeam: winningTeam
        };

        this.SetGameState(GameState.Result);
        this.broadcast(MultiplayMessageType.Result, message);
    }

    SendMessageMeetingTimer(messageBody: string) {
        const message: MultiplayMessageCallMeeting = 
        {
            messageBody: messageBody
        };
        console.log("Game Start..");
        this.broadcast(MultiplayMessageType.CallMeeting, message);
    }

    SendMessageMeetingFinished() {
        const message: MultiplayMessageMeetingFinished = 
        {
            userId : this.GetHighestVotes()
        };
        
        console.log(`User with Highest Votes: ${message.userId}`);
        this.broadcast(MultiplayMessageType.MeetingFinished, message);
    }
}
