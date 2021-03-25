import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

// import socialRoutes from "@colyseus/social/express"

import { MyRoom } from "./rooms/MyRoom";
import Auth from "./classes/Auth";

const port = Number(process.env.PORT || 2567);
const app = express()

app.use(cors());
app.use(express.json())
app.use(cookieParser());

const server = http.createServer(app);
const gameServer = new Server({
  server,
});

// register your room handlers
gameServer.define('my_room', MyRoom);

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

let auth:Auth = new Auth()

app.get("/login", (req, res) => auth.getLogin(req, res));
app.get("/callback", (req, res) => auth.getCallback(req, res));
app.get("/refresh_token", (req, res) => auth.getRefreshToken(req, res));
// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());
gameServer.listen(port);
console.log(`Listening on ws://localhost:${ port }`)
