/* eslint-disable no-unexpected-multiline */
import { ActiveLobby, Map, SeasonStatus, Server, User, Warning } from './models/index.js'
import { Gamemode, Factions } from './constants/index.js'
import { v4 as uuidv4 } from 'uuid';

class FServer {

    static async sendMsg(uid, io, event, msg = undefined) {
        try {
            const user = await User.findOne({ uid })
            if (user) {
                const sockets =await io.in(user.connectionId).fetchSockets()
                for (const socket of sockets) {
                    socket.emit(event, msg)
                }
            }
        } catch (error) {
            console.log(error)
        }
        
    }

    static async getUserSocketID(uid) {
        const user = await User.findOne({ uid })
        if (user) {
            return user.connectionId
        }
    }

    static async AddPlayerToLobby(uid, gamemode, io) {
        let [LobbiesFull, StillBanned, Requeue, AlreadyInLobby] = [false, false, false, false]
        const user = await User.findOne({ uid })
        if (!user) return
        if(user.uid=="initial" )return
        let player = {}

        // Check if any server of this gamemode is avaliable
        let servers = await Server.find({ region: user.region, gamemode, lobbyFull: false, playersCount: { $lt: gamemode } }, { _id: 0, __V: 0 }).sort({ playersCount: -1 }).limit(1).exec()
        if (servers.length > 0) {
            player.lobbyID = servers[0].lobbyID
        } else {
            LobbiesFull = true;
            await FServer.sendMsg(uid, io, "joinlobby", { code: 0, msg: 'Servers are currently unavailable for this gamemode!' })
            return
        }

        //check baned
        if (user.banned) {
            //check ban 
            if (user.banEnd) {
                if (new Date() < new Date(user.banEnd)) {
                    await FServer.sendMsg(uid, io, "joinlobby", { code: 0, msg: `You have been banned temporarily for ${user.banReason}. The ban will be lasting to ${new Date(user.banEnd).toLocaleTimeString()}` })
                    StillBanned = true
                    return
                }
                else {
                    await User.updateOne({ uid }, { banned: false, banEnd: null, banStart: null, banReason: null })
                    await Warning.deleteMany({ uid: user.uid })
                    StillBanned = false
                }
            }
            else {
                await FServer.sendMsg(uid, io, "joinlobby", { code: 0, msg: `You have been banned permanently for ${user.banReason}. You may request an appeal on the WBMM forum.` })
                return
            }

        }
        // check if player is in a lobby already
        await ActiveLobby.deleteMany({ uid })

        //get preset mmr and kdrate winrate
        let mmr, winRate, kdRate;
        if (gamemode == Gamemode.battle) {
            let tmp = await SeasonStatus.findOne({ uid }, { mmr: 1, bkills: 1, bdeaths: 1, bwins: 1, bdraws: 1, blosses: 1 })
            mmr = tmp.mmr
            winRate = (tmp.bwins + tmp.bdraws + tmp.blosses) == 0 ? 0 : (tmp.bwins / (tmp.bwins + tmp.bdraws + tmp.blosses))
            kdRate = tmp.bdeaths == 0 ? 0 : tmp.bkills / tmp.bdeaths
        } else if (gamemode == Gamemode.groupfight) {
            let tmp = await SeasonStatus.findOne({ uid }, { gmmr: 1, gkills: 1, gdeaths: 1, gwins: 1, gdraws: 1, glosses: 1 })
            mmr = tmp.gmmr
            winRate = (tmp.gwins + tmp.gdraws + tmp.glosses) == 0 ? 0 : (tmp.gwins / (tmp.gwins + tmp.gdraws + tmp.glosses))
            kdRate = tmp.gdeaths == 0 ? 0 : tmp.gkills / tmp.gdeaths
        }

        //update activelobby and server's playercount
        // Add main player to the lobby
        await ActiveLobby.updateOne({ uid }, {
            lobbyID: player.lobbyID,
            username: user.username,
            lobbyStatus: false,
            mmr,  //preset mmr for match end calculate
            winRate,
            kdRate,
            region:user.region
        }, { upsert: true })
        // Check if the player has been added
        if (await ActiveLobby.findOne({ uid }, { uid })) {
            let count = await ActiveLobby.countDocuments({ lobbyID: player.lobbyID })
            await Server.updateOne({ lobbyID: player.lobbyID }, { playersCount: count })

            // Check if Lobby is ready
            await FServer.UpdateLobby(player.lobbyID, io);
            await FServer.sendMsg(uid, io, "canjoinlobby", { gamemode, lobbyInfo: servers[0] })
            return
        } else {
            await FServer.sendMsg(uid, io, "requeue")
            return
        }

    }
    static async DeletePlayerFromLobby(uid, io) {
        let player = await ActiveLobby.findOne({ uid })
        if (!player) return
        let { lobbyID } = player
        // Check if player is in a started lobby
        let server = await Server.findOne({ lobbyID })
        if (!server.teamsAssigned) {
            //Delete player
            await ActiveLobby.findOneAndDelete({ uid })
            // Unready all players
            await ActiveLobby.updateMany({ lobbyID }, { lobbyStatus: false })
            // Retrieve the total players in the lobby
            const count = await ActiveLobby.countDocuments({ lobbyID })
            await Server.updateOne({ lobbyID }, { playersCount: count })
            const { connectionId } = await User.findOne({ uid })
            // Signal exit room
            io.in(connectionId).emit("canexitlobby")

            // Check if Lobby is ready
            await FServer.UpdateLobby(lobbyID, io);
        }

    }

    static async UpdateLobby(lobbyID, io) {
        let QueueFull = false;
        let MatchStarted = false;
        let faction1 = "", faction2 = "";
        let Team1UID = [], Team2UID = []


        let server = await Server.findOne({ lobbyID })
        let preMap = server.map;
        let gamemode = server.gamemode
        let region = server.region
        if (!server.lobbyReady) {
            // Check players in lobby
            let playersCount = await ActiveLobby.countDocuments({ lobbyID })
            if (playersCount != gamemode) {
                // Reset lobby full flag
                await Server.updateOne({ lobbyID }, { playersCount, lobbyFull: false })
                // Reset status
                await ActiveLobby.updateMany({ lobbyID }, { lobbyStatus: false })
            } else {
                QueueFull = true
                // Check if all players in the lobby are ready
                let unReadyPlayerCount = await ActiveLobby.countDocuments({ lobbyID, lobbyStatus: false })
                if (unReadyPlayerCount == 0) {
                    // Set lobby to countdown started = 1 so no one can join or leave
                    await Server.updateOne({ lobbyID }, { lobbyReady: true })
                    let playersCount = await ActiveLobby.countDocuments({ lobbyID })
                    if (playersCount == gamemode) {
                        // Check if all teams are already assigned
                        let currentServer = await Server.findOne({ lobbyID })
                        if (!currentServer.teamsAssigned) {
                            // Teams assigned = 1
                            await Server.updateOne({ lobbyID }, { teamsAssigned: true })

                            // Retrieve all players MMR
                            let mmrResult = await ActiveLobby.find({ lobbyID, team: 0 }, { uid: 1, mmr: 1 }).sort({ mmr: 'desc' })
                            for (const [index, row] of mmrResult) {
                                if (index % 2 == 1) Team1UID.push(row.uid)
                                else Team2UID.push(row.uid)
                            }
                            // Assign TEAM 1 and TEAM 2 players
                            await ActiveLobby.updateMany({ uid: { $in: Team1UID }, team: 0, lobbyID }, { team: 1, OpponentsTeam: 2 })
                            await ActiveLobby.updateMany({ uid: { $in: Team2UID }, team: 0, lobbyID }, { team: 2, OpponentsTeam: 1 })

                            // Random factions
                            // eslint-disable-next-line no-constant-condition
                            while (true) {
                                let max = Factions.length
                                faction1 = Factions[Math.floor(Math.random() * max)]
                                faction2 = Factions[Math.floor(Math.random() * max)]
                                if (faction1 != faction2) break;
                            }
                            // set to 'The Cage' map for groupfights and duels
                            let newMap = ""
                            if (gamemode == Gamemode.groupfight) {
                                newMap = 'The Cage'
                            } else {
                                newMap = (await Map.findOne({ mapName: { $ne: preMap } })).mapName
                            }
                            // Set lobby to countdown started = 1 so no one can join and set map/factions
                            await Server.updateOne({ lobbyID }, { faction1, faction2, map: newMap })

                            // Starting match!
                            await Server.updateOne({ lobbyID }, { matchStarted: true })

                            // Generate a random match id
                            let matchID = uuidv4()

                            // Set match id
                            await ActiveLobby.updateMany({ lobbyID }, { matchID, abandoned: true })

                            MatchStarted = true;
                            let now = new Date().toLocaleTimeString()
                            if (gamemode == Gamemode.groupfight) {
                                io.emit('chatMsg', {
                                    senderName: "Server",
                                    timeStamp: now,
                                    message: `${region} - ${lobbyID} - A groupfight has started!`
                                })
                            } else if (gamemode == Gamemode.battle) {
                                io.emit('chatMsg', {
                                    senderName: "Server",
                                    timeStamp: now,
                                    message: `${region} - ${lobbyID} - A battle has started!`
                                })
                            }
                            // Free the dynamic arrays
                        }
                    } else {
                        QueueFull = false

                        // Reset server
                        await Server.updateOne({ lobbyID }, { playersCount, lobbyFull: false, lobbyReady: false })
                        // Reset status
                        await ActiveLobby.updateMany({ lobbyID }, { lobbyStatus: false })
                    }
                }
            }


            // Select connection Ids for all players in the lobby and broadcast change
            const lobbyPlayers = await ActiveLobby.find({ lobbyID }, { _id: 0, __v: 0 })
            if (QueueFull) {
                // Check if countdown has started already before starting it
                let server = await Server.findOne({ lobbyID })
                if (!server.lobbyFull) {
                    this.getTimer(lobbyID, gamemode, io).reset()
                    await Server.findOneAndUpdate({ lobbyID },{lobbyFull:true})
                }

                // broad message to  lobbyID room
                for(let player of lobbyPlayers){
                    if (MatchStarted) {
                        await FServer.sendMsg(player.uid,io,'matchstarted')
                    } else {
                        await FServer.sendMsg(player.uid,io,'updatequeue', lobbyPlayers)
                    }
                }
                

            } else {
                for(let player of lobbyPlayers){
                    await FServer.sendMsg(player.uid,io,'updatequeue', lobbyPlayers)
                }
            }
        }
    }

    static async AcceptLobby(uid, io) {
        // Change player status
        let player = await ActiveLobby.findOneAndUpdate({ uid },{lobbyStatus:true},{new:true})
        // Check if Lobby is ready
        await FServer.UpdateLobby(player.lobbyID, io)
    }


    // static async NotifyPlayer(uid, NotificationMessage,io) {
    //   const {connectionId} = await User.findOne({uid})
    //   socket.to(connectionId).emit("notification", { NotificationMessage })
    // }

    static timerCollection = new Map()

    // static {
    //     this.timerCollection.set("test",1)
    // }

    static getLobbyTimer(lobbyID,gamemode,io) {
        return function(){
            
        }
    }

    static lobbyTimer(lobbyID,gamemode,io) {
        let timer = null;
        let initial = 30
        let CountdownTime = initial
        let CountdownCancelled = false
        let PlayersReady = false

        function loop() {
            let flag = (CountdownCancelled == true) || (PlayersReady == true)
            if (!flag)
                timer = setTimeout(async () => {
                    // Your logic here
                    let playerCount = await ActiveLobby.countDocuments({ lobbyID })
                    if (playerCount == gamemode) {
                        // Check if all players in the lobby are ready
                        let readyCount = await ActiveLobby.countDocuments({ lobbyID, lobbyStatus: true })
                        if (CountdownTime > 0) {
                            if (readyCount < gamemode) {
                                const unReadyLobbyPlayers = await ActiveLobby.find({ lobbyID,lobbyStatus: false }, { _id: 0, __v: 0 })
                                for (const player of unReadyLobbyPlayers) {
                                    FServer.sendMsg(player.uid,io,"updatetimer",{ CountdownTime })
                                }
                            } else {
                                CountdownTime = 0;
                                PlayersReady = true
                            }

                        } else {
                            // Kick players that didn't accept
                            CountdownCancelled = true;
                            let unReadyPlayerResult = await ActiveLobby.find({ lobbyID, lobbyStatus: false })
                            const now = new Date().toLocaleTimeString()
                            for (let player of unReadyPlayerResult) {
                                FServer.DeletePlayerFromLobby(player.uid, io);
                                io.emit('chatMsg', {
                                    senderName: "Server",
                                    timeStamp: now,
                                    message: `${player.region} - ${player.username} was kicked from lobby for not accepting match.`
                                })
                            }
                            if (gamemode != Gamemode.groupfight) {
                                io.emit('playerkicked', {
                                    senderName: "Server",
                                    timeStamp: now,
                                    message: `${unReadyPlayerResult[0].region} - ${gamemode - unReadyPlayerResult.length} / ${gamemode} are currently in a groupfight queue!`
                                })
                            } else {
                                io.emit('playerkicked', {
                                    senderName: "Server",
                                    timeStamp: now,
                                    message: `${unReadyPlayerResult[0].region} - ${gamemode - unReadyPlayerResult.length} / ${gamemode} are currently in a battle queue!`
                                })
                            }

                        }
                    } else {
                        CountdownCancelled = true;
                    }
                    CountdownTime--;
                    //new loop
                    loop(lobbyID,gamemode,io);
                }, 1000,lobbyID,gamemode,io);
        }

        function reset() {
            clearTimeout(timer);
            timer = null;
            CountdownTime = initial
            loop()
        }

        function stop(){
            clearTimeout(timer);
            timer = null;
        }
        return { loop, reset, stop }
    }
}

export {
    FServer
    //  FAdmin
}
