import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv';
import { User,Server as gameServer } from './models/index.js';
import userProcedure from './socket/user.js'
import serverProcedure from './socket/server.js'
import adminProcedure from './socket/admin.js'
import {getRegionUsers} from './database/getCurrentUsers.js';
import { Gamemode } from './constants/index.js';
import { instrument } from "@socket.io/admin-ui";
import { FServer } from './backend.js';
dotenv.config();


const regionUsersCount = getRegionUsers()
export function serverStarter(app) {
    const httpserver = http.createServer(app);
    const io = new Server(httpserver, {
        cors: {
            origin: ["http://localhost:4000","https://admin.socket.io","http://127.0.0.1:4000"],
            credentials: true
        },
        connectionStateRecovery: {
            // the backup duration of the sessions and the packets
            maxDisconnectionDuration: 2 * 60 * 1000,
            // whether to skip middlewares upon successful recovery
            skipMiddlewares: true,
        },
        pingTimeout: 60000
    });

    // instrument(io, {
    //     auth: {
    //       type: "basic",
    //       username: "admin",
    //       password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS" // "changeit" encrypted with bcrypt
    //     },
    //   });

    io.of("/").adapter.on("leave-room", (room, id) => {
        console.log(`socket ${id} has leave room ${room}`);
    });

    io.of("/").adapter.on("join-room", (room, id) => {
        console.log(`socket ${id} has joined room ${room}`);
    });

    app.use((req, res, next) => {
        req.io = io;
        return next();
    });

    io.of('/').on('connection', async socket => {
        if (!socket.handshake.auth.token) {
            socket.disconnect()
        }
        const uid = socket.handshake.auth.token
        const user = await User.findOne({ uid })
        if (!user) socket.disconnect()
        const {region,username} = user
                //定时更新当前在线人数到网页
        const timer = setInterval(async () => {
            const battleCount = (await gameServer.countDocuments({region,gamemode:Gamemode.battle,teamsAssigned:true}))
            const groupfightCount = (await gameServer.countDocuments({region,gamemode:Gamemode.groupfight,teamsAssigned:true}))
            
            
            socket.emit("currentCount",{
                onLineUsers:io.engine.clientsCount,
                regionUsers:regionUsersCount[region],
                battleCount,
                groupfightCount
            })
        }, 10*1000)

        socket.on('disconnecting',async () => {
            console.log(socket.id + " disconnected")
            //广播玩家离线信息
            io.emit('chatMsg', {
                senderName: "Server",
                timeStamp: new Date().toLocaleTimeString(),
                message: `${region} - ${username} has disconnected`
            })
            await FServer.DeletePlayerFromLobby(uid,io)
            await User.updateOne({uid},{connectionId:null})
            regionUsersCount[region]--
            clearInterval(timer)
        });


        userProcedure(socket, io, user)
        serverProcedure(socket, io, user)
        adminProcedure(socket, io, user)
    });

    const PORT = process.env.PORT || 3000;

    httpserver.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    });

    return io
}


