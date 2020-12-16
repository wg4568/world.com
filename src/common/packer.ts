import { List, PackingMachine, String8, Uint16, Uint8 } from "../lib/serialize";

export class Packer extends PackingMachine {
    constructor() {
        super();

        this.format("PlayerData", [
            Uint16, // id
            String8, // username
            Uint8 // dude
        ]);

        this.format("Vector3", [
            Uint16, // id
            Uint16, // x
            Uint16, // y
            Uint16, // z
            Uint8, // dx
            Uint8, // dy
            Uint8 // dz
        ]);

        this.format("Connect", [
            List // players
        ]);
    }
}
