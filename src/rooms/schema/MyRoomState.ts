import {Schema, type, ArraySchema} from "@colyseus/schema";
import {User} from "./User";
import {Message} from "./Message";
import {Song} from "./Song";
import {TrackState} from "./TrackState";

export class MyRoomState extends Schema {

    @type("string")
    mySynchronizedProperty: string = "Hello world";

    @type([User])
    users = new ArraySchema<User>();

    @type([Message])
    messages = new ArraySchema<Message>();

    @type("string")
    admin: string = ""

    @type([Song])
    songsQueue = new ArraySchema<Song>();

    @type(TrackState)
    trackState = new TrackState()
}
