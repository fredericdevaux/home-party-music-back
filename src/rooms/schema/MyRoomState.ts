import { Schema, type, ArraySchema } from "@colyseus/schema";
import {User} from "./User";

export class MyRoomState extends Schema {

  @type("string")
  mySynchronizedProperty: string = "Hello world";

  @type([ User ])
  users = new ArraySchema<User>();
}
