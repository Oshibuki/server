import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv';
import { User } from './models/index.js';
import userProcedure from './socket/user.js'
import serverProcedure from './socket/server.js'
import adminProcedure from './socket/admin.js'
dotenv.config();


export function serverStarter(app) {
    const httpserver = http.createServer(app);
    const io = new Server(httpserver, {
        cors: {
            origin: "http://localhost:4000"
        },
        connectionStateRecovery: {
            // the backup duration of the sessions and the packets
            maxDisconnectionDuration: 2 * 60 * 1000,
            // whether to skip middlewares upon successful recovery
            skipMiddlewares: true,
        }
    });

    const currentUsers = new Map()
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

                //定时更新当前在线人数到网页
        const timer = setInterval(() => {
            socket.emit("currentCount",io.engine.clientsCount)
        }, 2000)

        socket.on('disconnecting', () => {
            console.log(socket.id + " disconnected")
            //广播玩家离线信息
            io.emit('chatMsg', {
                senderName: "Server",
                timeStamp: new Date(),
                message: `${user.region} - ${user.username} has disconnected`
            })
            currentUsers.delete(uid)
            clearInterval(timer)
        });


        userProcedure(socket, io, user,currentUsers)
        serverProcedure(socket, io, user,currentUsers)
        adminProcedure(socket, io, user)
    });








    const PORT = process.env.PORT || 3000;

    httpserver.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    });

    return io
}


