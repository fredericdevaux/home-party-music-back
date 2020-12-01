import { Schema, type, ArraySchema } from "@colyseus/schema";
import {User} from "./User";
import {Message} from "./Message";

export class MyRoomState extends Schema {

  @type("string")
  mySynchronizedProperty: string = "Hello world";

  @type([ User ])
  users = new ArraySchema<User>();

  @type([ Message ])
  messages = new ArraySchema<Message>();
}
