import {Room, Client, generateId} from "colyseus";
import {MyRoomState} from "./schema/MyRoomState";
import {User} from "./schema/User";
import {Message} from "./schema/Message";
import {Song} from "./schema/Song";
import {Artist} from "./schema/Artist";
import {TrackState} from "./schema/TrackState";
import {deleteObjectFromArray} from "../utils/deleteObjectFromArray";
import {findObjectFromArray} from "../utils/findObjectFromArray";
import request from "request";
import {Blindtest} from "./schema/Blindtest";
import {Ranking} from "./schema/Ranking";

export class MyRoom extends Room {
    private progressMs = 0
    private interval: any = 0
    private intervalBlindtest: any = 0

    updateProgress(progressMs: number) {
        this.interval && clearInterval(this.interval)
        this.progressMs = progressMs
        this.interval = setInterval(() => {
            this.progressMs = this.progressMs + 100
        }, 100)
    }

    clockBlindtest() {
        this.intervalBlindtest = setInterval(() => {
            if ((this.state.blindtest.state === 'playing' && this.state.blindtest.duration === 30000) || (this.state.blindtest.state === 'next_round' && this.state.blindtest.duration === 5000)) {
                this.state.blindtest.duration = 0
                clearInterval(this.intervalBlindtest)
                if (this.state.blindtest.round === 15) {
                    this.changeBlindtestState('end')
                } else if (this.state.blindtest.state === 'next_round') {
                    this.changeBlindtestState('playing')
                    this.setNextBlindtestMusic()
                    this.clockBlindtest()
                } else {
                    this.changeBlindtestState('next_round')
                    if (this.state.blindtest.currentTrack) this.broadcast("add_blindtest_track_history", this.state.blindtest.currentTrack)
                    this.clockBlindtest()
                }
            } else {
                this.state.blindtest.duration = this.state.blindtest.duration + 1000
            }
        }, 1000)
    }

    createSong(song: any, isTrackStateItem: boolean = false) {
        let newSong = new Song()
        newSong.id = song.id
        if (isTrackStateItem) newSong.uid = song.uid
        song.artists && song.artists.forEach((artist: Artist) => {
            let newArtist = new Artist()
            newArtist.id = artist.id
            newArtist.name = artist.name
            newSong.artists.push(newArtist)
        })

        newSong.name = song.name
        newSong.imageUrl = song.album?.images[0].url || song.imageUrl || ''
        newSong.uri = song.uri
        newSong.duration = song.duration_ms

        if (song.queueBy) {
            newSong.queueBy.sessionId = song.queueBy.sessionId
            newSong.queueBy.username = song.queueBy.username
            newSong.queueBy.avatarUrl = song.queueBy.avatarUrl
            newSong.queueBy.id = song.queueBy.id
        }

        newSong.previewUrl = song.preview_url

        return newSong
    }

    createTrackState(trackState: any) {
        if (!trackState) return null

        const newTrackState = new TrackState()
        newTrackState.progressMs = trackState.position
        newTrackState.item = this.createSong(trackState.track_window.current_track, true)
        newTrackState.isPlaying = !trackState.paused

        return newTrackState
    }

    changeBlindtestState(state: string) {
        this.state.blindtest.state = state
        this.broadcast("change_blindtest_state", state)
    }

    setNextBlindtestMusic() {
        this.state.blindtest.round++
        this.state.blindtest.currentTrack = this.createSong(this.state.blindtest.tracks[this.state.blindtest.round - 1])
        this.broadcast("new_blindtest_music", {
            track: this.state.blindtest.tracks[this.state.blindtest.round - 1],
            round: this.state.blindtest.round
        })
    }

    onCreate(options: any) {
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
            const newSong = this.createSong(song)
            this.state.songsHistory.push(newSong)
            this.broadcast("history_song_added", newSong)
        })

        this.onMessage("delete_song_from_queue", (client, songId) => {
            const song = findObjectFromArray(this.state.songsQueue, 'id', songId)
            deleteObjectFromArray(this.state.songsQueue, 'id', songId)
            this.broadcast("next_history_song_added", song)
            this.broadcast("song_deleted", songId)
        })

        this.onMessage("creating_blindtest", (client) => {
            this.state.blindtest = new Blindtest()
            this.broadcast("change_room_state", "blindtest")
        })

        this.onMessage("choose_blindtest_tracks", (client, {genreId, accessToken}) => {
            this.state.blindtest.state = 'loading'
            this.broadcast("change_blindtest_state", "loading")

            const requestOptions = {
                url: `${process.env.SPOTIFY_BASE_API_URL}/browse/categories/${genreId}/playlists`,
                method: 'GET',
                qs: {
                    country: 'FR',
                    limit: 10
                },
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };

            request(requestOptions, (err, response, body) => {
                if (err) {
                    console.log(err);
                } else if (response.statusCode === 200) {
                    const res = JSON.parse(body)
                    res.playlists.items.forEach((playlist: { id: any; }) => {
                        const requestOptions2 = {
                            url: `${process.env.SPOTIFY_BASE_API_URL}/playlists/${playlist.id}/tracks`,
                            method: 'GET',
                            qs: {
                                country: 'FR',
                                limit: 30
                            },
                            withCredentials: true,
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        };
                        request(requestOptions2, (err, response, body) => {
                            if (err) {
                                console.log(err);
                            } else if (response.statusCode === 200) {
                                const res = JSON.parse(body)
                                for (let i = 0; i < 2; i++) {
                                    const randomSong = res.items[Math.floor(Math.random() * res.items.length)].track;
                                    const findSong = findObjectFromArray(this.state.blindtest.tracks, 'id', randomSong.id)

                                    if (findSong && Object.keys(findSong).length !== 0 && findSong.constructor === Object) {
                                        i--
                                    } else {
                                        const song = this.createSong(randomSong)
                                        this.state.blindtest.tracks.push(song)
                                    }

                                    if (this.state.blindtest.tracks.length === 15) {
                                        this.changeBlindtestState('next_round')
                                        this.clockBlindtest()
                                    }
                                }
                            } else {
                                console.log(response.statusCode)
                            }
                        })
                    })
                } else {
                    console.log(response.statusCode);
                }
            });
        })

        this.onMessage("increase_user_blindtestscore", (client, score) => {
            const itemIndex = this.state.users.findIndex((user: { sessionId: string; }) => user.sessionId === client.sessionId);
            this.state.users[itemIndex].blindtestScore += score
            console.log(this.state.users[itemIndex], score)
            this.broadcast("increase_user_blindtestscore", {user: this.state.users[itemIndex], score})
        })
    }

    onJoin(client: Client, options: any) {
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
        this.broadcast('user_join', newUser)

        const state = {
            trackState: TrackState,
            users: Array<User>(),
            songsQueue: Array<Song>(),
            songsHistory: Array<Song>(),
            roomState: String
        }

        state.trackState = trackState
        state.users = this.state.users
        state.songsQueue = this.state.songsQueue
        state.songsHistory = this.state.songsHistory
        state.roomState = this.state.roomState

        client.send('set_state', state)
    }

    onLeave(client: Client, consented: boolean) {
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
