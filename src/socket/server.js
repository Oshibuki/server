import { FServer } from "../backend.js"
import { ActiveLobby } from "../models/index.js"

export default async function (socket, io, user) {
    socket.on("joinlobby", ({ gamemode }) => { //joinlobby? param: {gamemode:6 or 12}
        try {
            FServer.AddPlayerToLobby(user.uid, gamemode, io)
        } catch (error) {
            console.log(error)
        }
    })

    socket.on("updatequeue",async ({ lobbyID }) => {
        try {
            const newLobby = await ActiveLobby.find({lobbyID},{ _id: 0, __v: 0,uid:0 })
            socket.emit('updatequeue',newLobby)
        } catch (error) {
            console.log(error)
        }
    })

    socket.on("exitlobby", () => {
        try {
            FServer.DeletePlayerFromLobby(user.uid,io);
        } catch (error) {
            console.log(error)
        }
    })

    socket.on("acceptmatch", () => {
        try {
            FServer.AcceptLobby(user.uid,socket);
        } catch (error) {
            console.log(error)
        }
    })

    // socket.on("notifyplayer", ({ uid, message }) => { //notifyplayer?uid?message
    //     FServer.NotifyPlayer(uid, message, io);
    // })

    // socket.on("pickplayer", ({ uid, team }) => { //notifyplayer?uid?message
    //     FServer.pickplayer(uid, team, io);
    // })
}
