import { Room, Client } from "colyseus";
import { MyRoomState } from "./schema/MyRoomState";
import {User} from "./schema/User";
import {Message} from "./schema/Message";

export class MyRoom extends Room {

  onCreate (options: any) {
    this.setState(new MyRoomState());

    this.onMessage("message", (client, message) => {
      let newMessage = new Message()
      newMessage.author = message.author
      newMessage.authorId = client.sessionId
      newMessage.content = message.content
      this.state.messages.push(newMessage)
      this.broadcast("message", newMessage)
    });


    this.state.admin = options.username

    this.onMessage("track_state", (client, trackState) => {
      console.log('WSH', trackState)
      this.state.trackState = trackState
      this.broadcast("track_state", trackState)
    })

  }

  onJoin (client: Client, options: any) {
    let newUser = new User()
    newUser.sessionId = client.sessionId
    newUser.username = options.username
    this.state.users.push(newUser);
    let newMessage = new Message()
    newMessage.content = `L'utilisateur ${options.username} a rejoint la room`
    this.broadcast("message", newMessage)
    this.broadcast('joined', newMessage)
  }

  onLeave (client: Client, consented: boolean) {
    const itemIndex = this.state.users.findIndex((user: { sessionId: string; }) => {
      return user.sessionId === client.sessionId;
    });

    let newMessage = new Message()
    newMessage.content = `L'utilisateur ${this.state.users[itemIndex].username} a quitté la room`
    this.broadcast("message", newMessage)

    this.state.users.splice(itemIndex, 1);
  }

  onDispose() {
  }
}
