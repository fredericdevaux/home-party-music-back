import { Schema, type } from "@colyseus/schema";

export class User extends Schema {
    @type("string")
    sessionId: string = ''

    @type("string")
    username: string = ''
}
