declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		players: MapSchema<Player>;
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
	}
}