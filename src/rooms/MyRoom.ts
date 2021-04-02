import {Room, Client, generateId} from "colyseus";
import { MyRoomState } from "./schema/MyRoomState";
import {User} from "./schema/User";
import {Message} from "./schema/Message";
import {Song} from "./schema/Song";
import {Artist} from "./schema/Artist";
import {TrackState} from "./schema/TrackState";
import {deleteObjectFromArray} from "../utils/deleteObjectFromArray";
import {findObjectFromArray} from "../utils/findObjectFromArray";

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
    newSong.imageUrl = song.album?.images[0].url || ''
    newSong.uri = song.uri
    newSong.duration = song.duration_ms

    if (song.user) {
      newSong.queueBy.sessionId = song.user.sessionId
      newSong.queueBy.username = song.user.username
      newSong.queueBy.avatarUrl = song.user.avatarUrl
      newSong.queueBy.id = song.user.id
    }

    return newSong
  }

  createTrackState(trackState: any) {
    if (!trackState) return null

    const newTrackState = new TrackState()
    newTrackState.progressMs = trackState.position
    newTrackState.item = this.createSong(trackState.track_window.current_track)
    newTrackState.isPlaying = !trackState.paused

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

    this.state.admin.username = options.username
    this.state.admin.avatarUrl = options.avatarUrl
    this.state.admin.id = options.id

    this.onMessage("update_track_state", (client, trackState) => {
      trackState && trackState.position && this.updateProgress(trackState.position)
      const newTrackState = this.createTrackState(trackState)

      if (newTrackState) {
        this.state.trackState = newTrackState
        this.broadcast("update_track_state", newTrackState)
      }
    })

    this.onMessage("add_song_to_queue", (client, song) => {
      const newSong = this.createSong(song)
      this.state.songsQueue.push(newSong)
      this.broadcast("new_song_added", newSong)
    })

    this.onMessage("add_song_history", (client, song) => {
      this.state.songsHistory.push(song)
    })

    this.onMessage("delete_song_from_queue", (client, songId) => {
      const song = findObjectFromArray(this.state.songsQueue, 'id', songId)
      deleteObjectFromArray(this.state.songsQueue, 'id', songId)
      this.broadcast("history_song_added", song)
      this.broadcast("song_deleted", songId)
    })
  }

  onJoin (client: Client, options: any) {
    let newUser = new User()

    newUser.sessionId = client.sessionId
    newUser.username = options.username
    newUser.id = options.id
    newUser.avatarUrl = options.avatarUrl
    this.state.users.push(newUser);

    let newMessage = new Message()
    newMessage.content = `${options.username} a rejoint la room`

    let trackState = this.state.trackState
    trackState.progressMs = this.progressMs

    this.broadcast("message", newMessage)
    this.broadcast('user_join', newUser )

    const state = {
      trackState: TrackState,
      users: Array<User>(),
      songsQueue: Array<Song>(),
      songsHistory: Array<Song>()
    }

    state.trackState = trackState
    state.users = this.state.users
    state.songsQueue = this.state.songsQueue
    state.songsHistory = this.state.songsHistory

    client.send('set_state', state)
  }

  onLeave (client: Client, consented: boolean) {
    const itemIndex = this.state.users.findIndex((user: { sessionId: string; }) => user.sessionId === client.sessionId);
    let newMessage = new Message()
    newMessage.content = `${this.state.users[itemIndex].username} a quitté la room`
    deleteObjectFromArray(this.state.users, 'sessionId', client.sessionId)
    this.broadcast("message", newMessage)
    this.broadcast("user_leave", client.sessionId)
  }

  onDispose() {
  }
}
