import { FServer } from "../backend"

export default async function (socket, io, user,currentUsers) {
    socket.on("joinlobby", ({ gamemode }) => { //joinlobby? param: {gamemode:6 or 12}
        FServer.AddPlayerToLobby(socket, user.uid, gamemode)
    })

    socket.on("exitlobby", () => {
        FServer.DeletePlayerFromLobby(socket,user.uid,currentUsers);
    })

    socket.on("acceptmatch", () => {
        FServer.AcceptLobby(user.uid, user.region);
    })

    socket.on("notifyplayer", ({ uid, message }) => { //notifyplayer?uid?message
        FServer.NotifyPlayer(uid, message, io);
    })
}
