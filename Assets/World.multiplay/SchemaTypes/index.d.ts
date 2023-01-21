declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		players: MapSchema<Player>;
		virusId: number;
		gameTimer: Timer;
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
}