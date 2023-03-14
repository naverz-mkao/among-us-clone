declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		players: MapSchema<Player>;
		virusId: string;
		gameTimer: Timer;
		votes: MapSchema<Vote>;
	}
	class Vector3Schema extends Schema {
		x: number;
		y: number;
		z: number;
	}
	class Player extends Schema {
		userId: string;
		characterState: number;
		position: Vector3Schema;
		sessionId: string;
		team: Team;
		spawnIndex: number;
		username: string;
	}
	class Team extends Schema {
		teamId: number;
	}
	class GameState extends Schema {
		stateId: number;
	}
	class Timer extends Schema {
		value: number;
	}
	class Vote extends Schema {
		value: number;
	}
}