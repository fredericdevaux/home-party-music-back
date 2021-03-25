import cors from "cors";
import {Application, Request, Response} from "express";
import express from "express";
const querystring = require("query-string");
const request = require("request");

class Auth {
    public app: Application;

    private readonly CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    private readonly CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    private readonly REDIRECT_URI = `${process.env.SERVER_URL}/callback`;
    private readonly STATE_KEY = "spotify_auth_state";


    public getLogin(req: Request, res: Response): void {
        const state = this.generateRandomString(16);
        res.cookie(this.STATE_KEY, state);
        const scope = "user-read-private user-read-email user-read-recently-played user-top-read user-read-playback-position user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming";
        res.redirect("https://accounts.spotify.com/authorize?" +
            querystring.stringify({
                client_id: this.CLIENT_ID,
                redirect_uri: this.REDIRECT_URI,
                response_type: "code",
                scope,
                state,
            }));
    }


    public getCallback(req: Request, res: Response): void {
        // your application requests refresh and access tokens
        // after checking the state parameter
        const code = req.query.code || null;
        const state = req.query.state || null;
        // @ts-ignore
        const storedState = req.cookies ? req.cookies[this.STATE_KEY] : null;
        if (state === null || state !== storedState) {
            res.redirect("/#" +
                querystring.stringify({
                    error: "state_mismatch",
                }));
        } else {
            res.clearCookie(this.STATE_KEY);
            const authOptions = {
                form: {
                    code,
                    grant_type: "authorization_code",
                    redirect_uri: this.REDIRECT_URI,
                },
                headers: {
                    Authorization: "Basic " + (new Buffer(this.CLIENT_ID + ":" + this.CLIENT_SECRET)
                        .toString("base64")),
                },
                json: true,
                url: "https://accounts.spotify.com/api/token",
            };

            request.post(authOptions, (error: Error, response: any, body: any) => {
                if (!error && response.statusCode === 200) {

                    const access_token = body.access_token;
                    const refresh_token = body.refresh_token;
                    res.cookie('access_token', access_token)
                    res.cookie('refresh_token', refresh_token)

                    res.redirect(`${process.env.APP_URL}/profile`);
                } else {
                    res.redirect("/#" +
                        querystring.stringify({
                            error: "invalid_token",
                        }));
                }
            });
        }
    }

    public getRefreshToken(req: Request, res: Response): void {
        // requesting access token from refresh token
        const refresh_token = req.query.refresh_token;
        const authOptions = {
            form: {
                grant_type: "refresh_token",
                refresh_token,
            },
            headers: {
                Authorization: "Basic " + (new Buffer(this.CLIENT_ID + ":" + this.CLIENT_SECRET)
                    .toString("base64"))
            },
            json: true,
            url: "https://accounts.spotify.com/api/token",
        };

        request.post(authOptions, (error: Error, response: any, body: any) => {
            if (!error && response.statusCode === 200) {
                const access_token = body.access_token;
                res.send({
                    access_token,
                });
            }
        });
    }

    private generateRandomString(length: number) {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

export default Auth;
