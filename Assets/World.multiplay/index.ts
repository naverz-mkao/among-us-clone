import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { Player, Vector3Schema } from "ZEPETO.Multiplay.Schema";

enum MultiplayMessageType {

    // When position is synced
    CharacterTransform = "CharacterTransform",

    // For Animation states
    CharacterState = "CharacterState",
}

//Transform position data
type MultiplayMessageCharacterTransform = {
    positionX: number,
    positionY: number,
    positionZ: number,
}

//Character state data
type MultiplayMessageCharacterState = {

    //state id number for translation to enum. 
    characterState: number
}

export default class extends Sandbox {
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
    }

    onLeave(client: SandboxPlayer, consented?: boolean) {
        // Delete the player data
        this.state.players.delete(client.userId);
    }

}
