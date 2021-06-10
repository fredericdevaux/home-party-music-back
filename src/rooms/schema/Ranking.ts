import {Schema, type} from "@colyseus/schema";
import {User} from "./User";

export class Ranking extends Schema {
    @type(User)
    player: User = new User()

    @type("number")
    score: number = 0
}
