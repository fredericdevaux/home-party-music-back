import { Schema, type } from "@colyseus/schema";

export class User extends Schema {
    @type("string")
    id: string = ''

    @type("string")
    sessionId: string = ''

    @type("string")
    username: string = ''

    @type("string")
    avatarUrl: string = ''

    @type("number")
    blindtestScore: number = 0
}
