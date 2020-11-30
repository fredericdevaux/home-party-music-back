import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
// import socialRoutes from "@colyseus/social/express"

import { MyRoom } from "./rooms/MyRoom";

const port = Number(process.env.PORT || 80);
const app = express()

app.use(cors());
app.use(express.json())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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

// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${ port }`)
