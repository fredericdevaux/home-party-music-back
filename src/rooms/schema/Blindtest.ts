import {ArraySchema, Schema, type} from "@colyseus/schema";
import {Song} from "./Song";

export class Blindtest extends Schema {
    @type("string")
    id: string = ''

    @type("string")
    state: string = 'choosing'

    @type("number")
    round: number = 0

    @type([Song])
    tracks = new ArraySchema<Song>();
}
