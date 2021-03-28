import {Schema, type} from "@colyseus/schema";

export class Artist extends Schema {
    @type("string")
    id: string = ''

    @type("string")
    name: string = ''
}
