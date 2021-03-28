import {ArraySchema, Schema, type} from "@colyseus/schema";
import {Artist} from "./Artist";

export class Song extends Schema {
    @type("string")
    id: string = ''

    @type([Artist])
    artists = new ArraySchema<Artist>();

    @type("string")
    name: string = ''

    @type("string")
    imageUrl: string = ''

    @type("string")
    uri: string = ''
}
