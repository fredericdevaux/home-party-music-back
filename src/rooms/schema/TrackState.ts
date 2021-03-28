import {Schema, type} from "@colyseus/schema";
import {Song} from "./Song";

export class TrackState extends Schema {
    @type("int64")
    progressMs: number = 0

    @type(Song)
    item: Song = new Song()

    @type("boolean")
    isPlaying: boolean = false

    @type("int64")
    duration: number = 0
}
