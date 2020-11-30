import { Room, Client } from "colyseus";
import { MyRoomState } from "./schema/MyRoomState";
import {User} from "./schema/User";

export class MyRoom extends Room {

  onCreate (options: any) {
    this.setState(new MyRoomState());

    this.onMessage("type", (client, message) => {
    });

  }

  onJoin (client: Client, options: any) {
    let newUser = new User()
    newUser.sessionId = client.sessionId
    newUser.username = options.username
    this.state.users.push(newUser);
  }

  onLeave (client: Client, consented: boolean) {
    const itemIndex = this.state.users.findIndex((user: { sessionId: string; }) => {
      return user.sessionId === client.sessionId;
    });

    this.state.users.splice(itemIndex, 1);
  }

  onDispose() {
  }
}
