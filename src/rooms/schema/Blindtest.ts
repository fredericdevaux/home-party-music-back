import {ArraySchema, Schema, type} from "@colyseus/schema";
import {Song} from "./Song";
import {Ranking} from "./Ranking";

export class Blindtest extends Schema {
    @type("string")
    id: string = ''

    @type(Song)
    currentTrack = new Song()

    @type("string")
    state: string = 'choosing'

    @type("number")
    duration: number = 0

    @type("number")
    round: number = 0

    @type([Song])
    tracksHistory = new ArraySchema<Song>();

    @type([Song])
    tracks = new ArraySchema<Song>();
}
