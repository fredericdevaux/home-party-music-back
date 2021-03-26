import { Schema, type } from "@colyseus/schema";

export class Message extends Schema {
    @type("string")
    author: string = ''

    @type("string")
    authorId: string = ''

    @type("string")
    content: string = ''

    date: Date = new Date()

    @type("string")
    type: string = 'system'
}
