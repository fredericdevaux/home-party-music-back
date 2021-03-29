import {Schema, type, ArraySchema} from "@colyseus/schema";
import {User} from "./User";
import {Message} from "./Message";
import {Song} from "./Song";
import {TrackState} from "./TrackState";

export class MyRoomState extends Schema {

    @type("string")
    name: string = "";

    @type([User])
    users = new ArraySchema<User>();

    @type([Message])
    messages = new ArraySchema<Message>();

    @type(User)
    admin = new User()

    @type([Song])
    songsQueue = new ArraySchema<Song>();

    @type([Song])
    songsHistory = new ArraySchema<Song>();

    @type(TrackState)
    trackState = new TrackState()
}
