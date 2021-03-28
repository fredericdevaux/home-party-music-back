import { Room, Client } from "colyseus";
import { MyRoomState } from "./schema/MyRoomState";
import {User} from "./schema/User";
import {Message} from "./schema/Message";
import {Song} from "./schema/Song";
import {Artist} from "./schema/Artist";
import {TrackState} from "./schema/TrackState";
import {deleteObjectFromArray} from "../utils/deleteObjectFromArray";

export class MyRoom extends Room {
  private progressMs = 0
  private interval: any = 0

  updateProgress(progressMs: number) {
    this.interval && clearInterval(this.interval)
    this.progressMs = progressMs
    this.interval = setInterval(() => {
      this.progressMs = this.progressMs + 100
    }, 100)
  }

  createSong(song: any) {
    let newSong = new Song()
    newSong.id = song.id
    song.artists.forEach((artist: Artist) => {
      let newArtist = new Artist()
      newArtist.id = artist.id
      newArtist.name = artist.name
      newSong.artists.push(newArtist)
    })
    newSong.name = song.name
    newSong.imageUrl = song.album.images[0].url
    newSong.uri = song.uri

    return newSong
  }

  createTrackState(trackState: any) {
    const newTrackState = new TrackState()
    newTrackState.progressMs = trackState.progress_ms
    newTrackState.item = this.createSong(trackState.item)
    newTrackState.duration = trackState.timestamp
    newTrackState.isPlaying = trackState.is_playing

    return newTrackState
  }

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

    this.state.admin = options.admin

    this.onMessage("track_state", (client, trackState) => {
      this.state.trackState = this.createTrackState(trackState)
      this.updateProgress(trackState.progressMs)
    })

    this.onMessage("update_track_state", (client, trackState) => {
      this.updateProgress(trackState.progress_ms)
      const newTrackState = this.createTrackState(trackState)
      this.state.trackState = newTrackState
      this.broadcast("update_track_state", newTrackState)
    })

    this.onMessage("add_song_to_queue", (client, song) => {
      const newSong = this.createSong(song)
      this.state.songsQueue.push(newSong)
      this.broadcast("new_song_added", newSong)
    })

    this.onMessage("delete_song_from_queue", (client, songId) => {
      deleteObjectFromArray(this.state.songsQueue, 'id', songId)
      this.broadcast("song_deleted", songId)
    })
  }

  onJoin (client: Client, options: any) {
    let newUser = new User()
    newUser.sessionId = client.sessionId
    newUser.username = options.username
    this.state.users.push(newUser);
    let newMessage = new Message()
    newMessage.content = `L'utilisateur ${options.username} a rejoint la room`
    let trackState = this.state.trackState
    trackState.progressMs = this.progressMs
    this.broadcast("message", newMessage)
    this.broadcast('user_join', newUser )
    const state = {
      trackState: TrackState,
      users: Array<User>(),
      songsQueue: Array<Song>()
    }
    state.trackState = trackState
    state.users = this.state.users
    state.songsQueue = this.state.songsQueue
    client.send('set_state', state)
  }

  onLeave (client: Client, consented: boolean) {
    const itemIndex = this.state.users.findIndex((user: { sessionId: string; }) => user.sessionId === client.sessionId);
    let newMessage = new Message()
    newMessage.content = `L'utilisateur ${this.state.users[itemIndex].username} a quitté la room`
    deleteObjectFromArray(this.state.users, 'sessionId', client.sessionId)
    this.broadcast("message", newMessage)
    this.broadcast("user_leave", client.sessionId)
  }

  onDispose() {
  }
}
