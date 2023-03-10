import { ActiveLobby, Ban, Friend, Map, MatchHistory, PlayerArchive, PlayerStatus, Report, SeasonStatus, Server, User, Warning } from './models'
import { Gamemode } from './constants'

class FServer {

    async AddPlayerToLobby(socket, uid, gamemode) {
        let [LobbiesFull, AlreadyInLobby, StillBanned, Requeue, Duo] = [false, false, false, false, false]
        const user = await User.findOne({ uid })
        if (!user) return
        let player = {}

        //check baned
        if (user.banned) {
            //check ban 
            if (user.banEnd) {
                if (new Date() < new Date(user.banEnd)) {
                    socket.emit("joinlobby", { code: 0, msg: `You have been banned temporarily for ${user.banReason}. The ban will be lasting to ${new Date(user.banEnd).toLocaleTimeString()}` })
                    StillBanned = true
                }
                else {
                    await User.updateOne({ uid }, { banned: false, banEnd: null, banStart: null, banReason: null })
                    await Warning.deleteMany({ uid: user.uid })
                    StillBanned = false
                }
            }
            else {
                socket.emit("joinlobby", { code: 0, msg: `You have been banned permanently for ${user.banReason}. You may request an appeal on the WBMM forum.` })
                return
            }

        }
        if (StillBanned) return

        // Check if any server of this gamemode is avaliable
        let servers = await Server.find({ region: user.region, gamemode, lobbyFull: false, playersCount: { $lt: gamemode } }).sort({ playersCount: -1 }).limit(1).exec()
        if (servers.length > 0) {
            player.lobbyID = servers[0].lobbyID
        } else {
            LobbiesFull = true;
            socket.emit("joinlobby", { code: 0, msg: 'Servers are currently unavailable for this gamemode!' })
            return
        }

        // check if player is in a full lobby already
        let tmp = await ActiveLobby.aggregate([
            { "$match": { uid, lobbyID: player.lobbyID } },
            {
                "$lookup": {
                    "localField": "lobbyID",
                    "from": "server",
                    "foreignField": "lobbyID",
                    "as": "currentLobby"
                }
            },
            { "$unwind": "$currentLobby" },
            {
                "$project": {
                    "uid": 1,
                    "lobbyID": 1,
                    "currentLobby.lobbyFull": 1
                }
            }
        ])
        if (tmp.length > 0) {
            AlreadyInLobby = true
            socket.emit("joinlobby", { code: 0, msg: 'You are already in a lobby!' })
            return
        }

        //get preset mmr
        let mmr;
        if (gamemode == Gamemode.battle) {
            let tmp = await SeasonStatus.findOne({ uid }, { mmr: 1 })
            mmr = tmp.mmr
        } else if (gamemode == Gamemode.groupfight) {
            let tmp = await SeasonStatus.findOne({ uid }, { gmmr: 1 })
            mmr = tmp.gmmr
        }

        //update activelobby and server's playercount
        // Add main player to the lobby
        await ActiveLobby.updateOne({ uid }, {
            lobbyID: player.lobbyID,
            username: user.username,
            lobbyStatus: false,
            mmr: mmr,  //preset mmr for match end calculate

        }, { upsert: true })
        // Check if the player has been added
        if (await ActiveLobby.findOne({ uid }, { uid })) {
            let count = await ActiveLobby.countDocuments({ lobbyID: player.lobbyID })
            await Server.updateOne({ lobbyID: player.lobbyID }, { playersCount: count })
            socket.emit("joinlobby", { code: 1, msg: 'canjoinlobby' })
            // Check if Lobby is ready
            UpdateLobby(uid, Region, Player.LobbyID);
        } else {
            socket.emit("joinlobby", { code: 0, msg: 'can not join in.Please retry' })

        }

    };
    async DeletePlayerFromLobby(socketId, uid, io) {
        let record = await ActiveLobby.findOne({ uid })
        // Check if player is in a started lobby
        let server = await Server.findOne({ lobbyID: record.lobbyID })
        if (!server.teamsAssigned) {
            //Delete player
            await ActiveLobby.findByIdAndDelete({ uid })
            // Unready all players
            await ActiveLobby.updateMany({ lobbyID: record.lobbyID }, { lobbyStatus: false })
            // Retrieve the total players in the lobby
            const count = await ActiveLobby.countDocuments({ lobbyID: record.lobbyID })
            await Server.updateOne({ lobbyID: record.lobbyID }, { playersCount: count })

            // Signal exit room
            io.to(socketId).emit("canexitlobby")
            // Check if Lobby is ready
            UpdateLobby(uid, Region, Player.LobbyID);
        }

    };

    async matchTimer(region, lobbyID, gamemode, CountdownTime, io, currentUsers) {
        let CountdownCancelled = False;
        let PlayersReady = False;
        (function loop() {
            let flag = (CountdownCancelled == true) || (PlayersReady == true)
            if (!flag) {
                setTimeout(async () => {
                    // Your logic here
                    let playerCount = await ActiveLobby.countDocuments({ lobbyID })
                    if (playerCount == gamemode) {
                        // Check if all players in the lobby are ready
                        let readyCount = await ActiveLobby.countDocuments({ lobbyID, lobbyStatus: true })
                        if (CountdownTime > 0) {
                            if (readyCount < Gamemode) {
                                // Load lobby players conlnection ids
                                let statusResult = await ActiveLobby.find({ lobbyID })
                                for (let row of statusResult) {
                                    if (!row.lobbyStatus) {
                                        io.to(currentUsers.get(row.uid)).emit("updatetimer", { CountdownTime })
                                    }
                                }
                            } else {
                                CountdownTime = 0;
                                PlayersReady = true
                            }

                        } else {
                            // Kick players that didn't accept
                            let unReadyPlayerResult = await ActiveLobby.find({ lobbyID, lobbyStatus: true })
                            const now = new Date().toLocaleTimeString()
                            for (let player of unReadyPlayerResult) {
                                FServer.DeletePlayerFromLobby(socket_id, player.uid, currentUsers);
                                io.emit('chatMsg', {
                                    senderName: "Server",
                                    timeStamp: now,
                                    message: `${player.region} - ${player.username} was kicked from lobby for not accepting match.`
                                })
                            }
                            if (Gamemode > 6) {
                                io.emit('playerkicked', {
                                    timeStamp: now,
                                    message: `${player.region} - ${gamemode-unReadyPlayerResult.length} / ${gamemode} are currently in a groupfight queue!`
                                })
                            } else {
                                io.emit('playerkicked', {
                                    timeStamp: now,
                                    message: `${player.region} - ${gamemode-unReadyPlayerResult.length} / ${gamemode} are currently in a battle queue!`
                                })
                            }
                            CountdownCancelled = true;
                        }
                    } else {
                        CountdownCancelled = true;
                    }
                    CountdownTime--;
                    //new loop
                    loop();
                }, 1000);
            }
        })();

    }

    async UpdateLobby(uid, region, lobbyID, io, socket, currentUsers) {
        let QueueFull = False;
        let LobbyReady = False;
        let MatchStarted = False;
        let MatchId;
        let Faction1, Faction2;
        let MapName;
        let [Team1MMR, Team2MMR, Team1UID, Team2UID, ] = [[], [], [], []]
        const lobbyReadySql = 'SELECT Gamemode, LobbyReady FROM servers WHERE LobbyID = ?'
        const playersCountSql = 'SELECT COUNT(*) AS PlayersCount FROM active_lobby WHERE LobbyID = ?'
        const lobbyStatusSql = 'SELECT LobbyStatus FROM active_lobby WHERE LobbyID = ?'


        let lobbyResult = await DBConnection.awaitQuery(lobbyReadySql, LobbyID)
        const Gamemode = lobbyResult[0].Gamemode
        if (!lobbyResult[0].LobbyReady) {
            // Check players in lobby
            let playersCountResult = await DBConnection.awaitQuery(playersCountSql, LobbyID)
            let PlayersCount = playersCountResult[0].PlayersCount

            // Check if we have a total of x players in the lobby depending on game mode
            if (PlayersCount == Gamemode) {
                QueueFull = true

                // Check if all players in the lobby are ready
                let lobbyStatusResult = await DBConnection.awaitQuery(lobbyStatusSql, LobbyID)
                for (const row of lobbyStatusResult) {
                    if (!row.LobbyStatus) {
                        LobbyReady = false
                        break
                    }
                    LobbyReady = true
                }

                if (LobbyReady) {
                    // Set lobby to countdown started = 1 so no one can join or leave
                    await DBConnection.awaitQuery('UPDATE servers SET LobbyReady = 1 WHERE LobbyID = ?', LobbyID)
                    // Check if there are 2 players in the lobby
                    let playerCountResult = await DBConnection.awaitQuery('SELECT COUNT(*) AS PlayersCount FROM active_lobby WHERE LobbyID = ?', LobbyID)
                    let PlayersCount = playerCountResult[0].PlayersCount

                    if (PlayersCount == Gamemode) {
                        // Check if all teams are already assigned
                        let teamAssignedResult = await DBConnection.awaitQuery('SELECT TeamsAssigned FROM servers WHERE LobbyID = ?', LobbyID)
                        if (!teamAssignedResult[0].TeamsAssigned) {
                            // Teams assigned = 1
                            await DBConnection.awaitQuery('UPDATE servers SET TeamsAssigned = 1 WHERE LobbyID = ?', LobbyID)

                            // Retrieve all players MMR
                            let mmrResult = await DBConnection.awaitQuery('SELECT UID, HiddenMMR AS MMR FROM active_lobby WHERE LobbyID = ? AND Team = 0 ORDER BY MMR DESC', LobbyID)
                            for (const row of mmrResult) {
                                if (Team1MMR.length == 0 && Team2MMR.length == 0) {
                                    // Choose player for a team with highest mmr
                                    if ((Math.random() + 0.1) >= 0.5) {
                                        Team1MMR.push(row.MMR)
                                        Team1UID.push(row.UID)
                                    } else {
                                        Team2MMR.push(row.MMR)
                                        Team2UID.push(row.UID)
                                    }
                                } else {
                                    // Teams player counts
                                    if (Team1MMR.length == (Gamemode / 2) || Team2MMR.length == (Gamemode / 2)) {
                                        // Team 1 player count
                                        if (Team1MMR.length == (Gamemode / 2)) {
                                            Team2MMR.push(row.MMR)
                                            Team2UID.push(row.UID)
                                        } else {
                                            Team1MMR.push(row.MMR)
                                            Team1UID.push(row.UID)
                                        }
                                    } else {
                                        if (Math.sum(Team1MMR) >= Math.sum(Team2MMR)) {
                                            Team2MMR.push(row.MMR)
                                            Team2UID.push(row.UID)
                                        } else {
                                            Team1MMR.push(row.MMR)
                                            Team1UID.push(row.UID)
                                        }
                                    }
                                }
                            }

                            // Assign TEAM 1 and TEAM 2 players
                            for (let i = 1; i <= Team1UID.length; i++) {
                                await DBConnection.awaitQuery('UPDATE active_lobby SET Team = 1, OpponentsTeam = 2 WHERE LobbyID = ? AND UID = ? AND Team = 0 LIMIT 1', [LobbyID, Team1UID[i - 1]])

                            }
                            for (let i = 1; i <= Team2UID.length; i++) {
                                await DBConnection.awaitQuery('UPDATE active_lobby SET Team = 2, OpponentsTeam = 1 WHERE LobbyID = ? AND UID = ? AND Team = 0 LIMIT 1', [LobbyID, Team2UID[i - 1]])

                            }

                            // Random factions
                            while (true) {
                                let max = Factions.length
                                Faction1 = Factions[Math.floor(Math.random() * max)]
                                Faction2 = Factions[Math.floor(Math.random() * max)]
                                if (Faction1 != Faction2) break;
                            }

                            // set to 'The Cage' map for groupfights and duels
                            if (Gamemode == 2 || Gamemode == 6) {
                                MapName = 'The Cage'
                            } else {
                                let mapResult = await DBConnection.awaitQuery('SELECT MapName FROM maps WHERE MapName NOT IN(SELECT Map FROM servers) AND Active = 1 ORDER BY RAND() LIMIT 1;')
                                MapName = mapResult[0].MapName
                            }
                            // Set lobby to countdown started = 1 so no one can join and set map/factions
                            await DBConnection.awaitQuery('UPDATE servers SET Faction1 = ?, Faction2 = ?, Map = ? WHERE LobbyID = ?', [Faction1, Faction2, MapName, LobbyID])

                            // Starting match!
                            await DBConnection.awaitQuery('UPDATE servers SET MatchStarted = 1 WHERE LobbyID = ?', LobbyID)

                            // Generate a random match id
                            while (true) {
                                MatchId = _RandomCode(8)

                                // Check if match id is unique
                                let matchResult = await DBConnection.awaitQuery('SELECT match_history.MatchId, active_lobby.MatchId FROM match_history INNER JOIN active_lobby ON match_history.MatchId = ? OR active_lobby.MatchId = ?', [MatchId, MathcId])
                                if (matchResult.length == 0) break;
                            }

                            // Set match id
                            await DBConnection.awaitQuery('UPDATE active_lobby SET MatchId = ?, Abandoned = 1 WHERE LobbyID = ?', [MatchId, LobbyID])

                            MatchStarted = true;

                            if (Gamemode == 2) {
                                let duelResult = await DBConnection.awaitQuery(`SELECT GROUP_CONCAT(Name SEPARATOR '' and '') AS Duel FROM active_lobby WHERE LobbyID = ?;`, LobbyID)
                                this.BroadcastServerMsg('matchstarted', Region, LobbyID + ' - ' + 'A duel between ' + Query.FieldByName('Duel').AsString + ' has started!', io, socket);
                            } else if (Gamemode == 6) {
                                this.BroadcastServerMsg('matchstarted', Region, LobbyID + ' - ' + 'A groupfight has started!', io, socket)
                            } else if (Gamemode > 6) {
                                this.BroadcastServerMsg('matchstarted', Region, LobbyID + ' - ' + 'A battle has started!', io, socket);
                            }
                            // Free the dynamic arrays
                        }
                    } else {
                        QueueFull = false

                        // Reset server
                        await DBConnection.awaitQuery('UPDATE servers SET PlayersCount = ?, LobbyFull = 0, LobbyReady = 0 WHERE LobbyID = ?', [PlayersCount, LobbyID])

                        // Reset status
                        await DBConnection.awaitQuery('UPDATE active_lobby SET LobbyStatus = 0 WHERE LobbyID = ?', LobbyID)
                    }
                }
            } else {
                // Reset lobby full flag
                await DBConnection.awaitQuery('UPDATE servers SET PlayersCount = ?, LobbyFull = 0 WHERE LobbyID = ?', [PlayersCount, LobbyID])
                // Reset status
                await DBConnection.awaitQuery('UPDATE active_lobby SET LobbyStatus = 0 WHERE LobbyID = ?', [PlayersCount, LobbyID])
            }

            if (QueueFull) {
                // Check if countdown has started already before starting it
                let lobbyFullResult = await DBConnection.awaitQuery('SELECT LobbyFull FROM servers WHERE LobbyID = ?', LobbyID)
                if (!lobbyFullResult[0].LobbyFull) {
                    this.matchTimer(Region, LobbyID, Gamemode, 30, io, currentUsers)
                    await DBConnection.awaitQuery('UPDATE servers SET LobbyFull = 1 WHERE LobbyID = ?', LobbyID)
                }

                // Select connection Ids for all players in the lobby and broadcast change
                let ConnectionIdResult = await DBConnection.awaitQuery('SELECT ConnectionId, Region FROM wbmm_users.users INNER JOIN active_lobby ON active_lobby.UID = users.UID AND active_lobby.LobbyID = ?;', LobbyID)
                for (const row of ConnectionIdResult) {
                    // broadcast lobby change
                    if (MatchStarted) {
                        WServer.WriteData(row.ConnectionId, 'matchstarted')
                    } else {
                        WServer.WriteData(row.ConnectionId, 'updatequeue')
                    }
                }
            } else {
                // Select connection Ids for all players in the lobby and broadcast change
                let ConnectionIdResult = await DBConnection.awaitQuery('SELECT ConnectionId FROM wbmm_users.users INNER JOIN active_lobby ON active_lobby.UID = users.UID AND active_lobby.LobbyID = ?;', LobbyID)
                for (const row of ConnectionIdResult) {
                    // broadcast lobby change
                    WServer.WriteData(row.ConnectionId, 'updatequeue');
                }
            }
        }
    };

    async AcceptLobby(uid, region, io, socket) {
        // Change player status
        await ActiveLobby.updateOne({uid},{lobbyStatus:true})
        // Check if Lobby is ready
        this.UpdateLobby(uid, region, lobbyID, io, socket);
    };


    async NotifyPlayer(uid, NotificationMessage, io,currentUsers) {
            io.to(currentUsers.get(uid)).emit("notification",{NotificationMessage})
        }
    };
}


class FAdmin {
    async WarnPlayer(ConnectionId, UID, WarningMessage, ReportID, io, socket) {
        // Retrieve player UID
        let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE ConnectionId = ?;', ConnectionId)
        if (result.length > 0) {
            let Admin = {
                UID: result[0].UID,
                Name: result[0].username
            }
            result = await DBConnection.awaitQuery('SELECT admins.UID, users.username AS username FROM admins INNER JOIN wbmm_users.users ON admins.UID = users.UID WHERE admins.UID = ?;', Admin.UID)
            if (result.length > 0) { // Admin confirmed
                let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE UID = ?;', UID)
                if (result.length > 0) {
                    let User = {
                        UID: result[0].UID,
                        Name: result[0].username
                    }
                    if (WarningMessage.length > 0 && WarningMessage.length <= 200) {
                        // add warning to database
                        await DBConnection.awaitQuery('INSERT INTO warnings(UID, Username, Warning, Expired) VALUES (?, ?, ?, NOW() + INTERVAL 7 DAY);', [User.UID, User.Name, WarningMessage])
                        // add course of action to archive
                        await DBConnection.awaitQuery('INSERT INTO player_archive(UID, Username, Admin, Action, Message) VALUES (?, ?, ?, ?, ?);', [User.UID, User.Name, Admin.Name, 'Warned', WarningMessage])

                        let result = await DBConnection.awaitQuery('SELECT ConnectionId FROM wbmm_users.users WHERE UID = ?;', UID)

                        WServer.WriteData(result[0].ConnectionId, 'warnnotify?You have received a warning!');
                        if (ReportID > 0) {
                            await DBConnection.awaitQuery('UPDATE reports SET Solved = ? WHERE Id = ?;', ['Player has been warned by ' + Admin.Name, ReportID])
                        }
                        WServer.WriteData(ConnectionId, 'adminpanel?1?' + User.Name + ' has been warned successfully!');
                    }
                }
            }
        }



    };

    async BanPlayer(ConnectionId, UID, Reason, Hours, Permanent, ReportID, io, socket) {
        // Retrieve caller info
        let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE ConnectionId = ?;', ConnectionId)
        if (result.length > 0) {
            let Admin = {
                UID: result[0].UID,
                Name: result[0].username
            }
            let result = await DBConnection.awaitQuery('SELECT admins.UID FROM admins INNER JOIN wbmm_users.users ON admins.UID = users.UID WHERE admins.UID = ?;', Admin.UID)
            if (result.length > 0) { // Admin confirmed
                let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE UID = ?;', UID)
                if (result.length > 0) {
                    let User = {
                        UID: result[0].UID,
                        Name: result[0].username
                    }
                    if (Reason.length > 0 && Reason.length <= 200) {
                        let hours = Hours.ToString()
                        if (hours.length > 0 && hours.length <= 3) {
                            if (Permanent) {
                                // Ban player permanently
                                await DBConnection.awaitQuery('REPLACE INTO wbmm_users.ban_list(UID, Username, BanReason) VALUES (?, ?,?);', [User.UID, User.Name, Reason])
                                await DBConnection.awaitQuery('DELETE FROM warnings WHERE Username = ?;', User.Name)
                            } else {
                                // Ban player temporarily
                                await DBConnection.awaitQuery('REPLACE INTO wbmm_users.ban_list(UID, Username, BanReason, BanStart, BanEnd) VALUES (?, ?, ?, NOW(), NOW() + INTERVAL ? HOUR);', [User.UID, User.Name, Reason, Hours])

                                await DBConnection.awaitQuery('DELETE FROM warnings WHERE Username = ?;', User.Name)
                            }

                            // add course of action to player archive
                            let message = Permanent ? 'Banned permanently - ' + Reason : 'Banned for ' + Hours + ' hours - ' + Reason
                            await DBConnection.awaitQuery('INSERT INTO player_archive(UID, Username, Admin, Action, Message) VALUES (?, ?, ?, ?, ?);', [User.UID, User.Name, Admin.Name, 'Banned', message])

                            let result = await DBConnection.awaitQuery('SELECT ConnectionId FROM wbmm_users.users WHERE username = ?;', User.Name)

                            if (Permanent)
                                WServer.WriteData(result[0].ConnectionId, 'bannotify?You have been banned permanently!')
                            else
                                WServer.WriteData(result[0].ConnectionId, 'bannotify?You have been banned temporarily!');

                            if (ReportID) {
                                await DBConnection.awaitQuery('UPDATE reports SET Solved = ? WHERE Id = ?;', ['Player has been banned by ' + Admin.Name, ReportID])
                            }

                            WServer.WriteData(ConnectionId, 'adminpanel?1?' + User.Name + ' has been banned successfully!');
                        }



                    }
                }
            }
        }
    };

    async UnbanPlayer(ConnectionId, UID, Reason, io, socket) {
        let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE ConnectionId = ?;', ConnectionId)
        if (result.length > 0) {
            let Admin = {
                UID: result[0].UID,
                Name: result[0].username
            }
            let result = await DBConnection.awaitQuery('SELECT admins.UID FROM admins INNER JOIN wbmm_users.users ON admins.UID = users.UID WHERE admins.UID = ?;', Admin.UID)
            if (result.length > 0) { // Admin confirmed
                let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE UID = ?;', UID)
                if (result.length > 0) {
                    let User = {
                        UID: result[0].UID,
                        Name: result[0].username
                    }
                    if (Reason.length > 0 && Reason.length <= 100) {
                        // Unban player
                        await DBConnection.awaitQuery('DELETE FROM wbmm_users.ban_list WHERE username = ?;', User.Name)
                        await DBConnection.awaitQuery('DELETE FROM warnings WHERE Username = ?;', User.Name)

                        // add course of action to archive
                        await DBConnection.awaitQuery('INSERT INTO player_archive(UID, Username, Admin, Action, Message) VALUES (?, ?, ?, ?, ?);', [User.UID, User.Name, Admin.Name, 'Unbanned', Reason])

                        WServer.WriteData(ConnectionId, 'adminpanel?1?' + User.Name + ' has been unbanned successfully!');
                    }
                }
            }
        }
    };

    async EditUserName(ConnectionId, UID, NewUsername, io, socket) {
        // Retrieve player UID
        let result = await DBConnection.awaitQuery('SELECT users.UID, username FROM wbmm_users.users INNER JOIN admins ON ConnectionId = ? AND users.UID = admins.UID;', ConnectionId)
        if (result.length > 0) { // Admin confirmed
            let Admin = {
                UID: result[0].UID,
                Name: result[0].username
            }
            let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE UID = ?;', UID)
            if (result.length > 0) {
                let User = {
                    UID: result[0].UID,
                    Name: result[0].username
                }
            }
            if (NewUsername.length <= 15 && NewUsername.length > 1) {
                let result = await DBConnection.awaitQuery('SELECT UID FROM wbmm_users.users WHERE username = ?;', NewUsername)
                if (result.length > 0) {
                    // Set player name
                    await DBConnection.awaitQuery('UPDATE wbmm_users.users SET username = ? WHERE username = ?;', [NewUsername, User.Name])
                    // Set new player name if player is in lobby
                    await DBConnection.awaitQuery('UPDATE active_lobby SET Name = ? WHERE Name = ?;', [NewUsername, User.Name])
                    // add course of action to archive
                    await DBConnection.awaitQuery('INSERT INTO player_archive(UID, Username, Admin, Action, Message) VALUES (?, ?, ?, ?, ?);', [User.UID, User.Name, Admin.Name, 'Name changed', 'Player name changed to ' + NewUsername])

                    WServer.WriteData(ConnectionId, 'adminpanel?1?' + User.Name + 's name has been changed successfully!');
                } else {
                    WServer.WriteData(ConnectionId, 'adminpanel?0?Username already taken!');
                }
            } else {
                WServer.WriteData(ConnectionId, 'adminpanel?0?Username must be between 2 and 15 chars.');
            }
        }
    };

    async PromoteUser(ConnectionId, UID, io, socket) {
        // Retrieve caller info
        let result = await DBConnection.awaitQuery('SELECT users.UID, username FROM wbmm_users.users INNER JOIN admins ON ConnectionId = ? AND users.UID = admins.UID AND admins.HeadAdmin = 1;', ConnectionId)
        if (result.length > 0) { // Admin confirmed
            let Admin = {
                UID: result[0].UID,
                Name: result[0].username
            }
            let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE UID = ?;', UID)
            if (result.length > 0) {
                let User = {
                    UID: result[0].UID,
                    Name: result[0].username
                }

                //check if user was admin
                let result = await DBConnection.awaitQuery('SELECT admins.UID FROM wbmm_users.users INNER JOIN admins ON username = ? AND admins.UID = users.UID;', User.Name)
                if (result.length == 0) {
                    // Add user to admins
                    await DBConnection.awaitQuery('INSERT INTO admins(UID) VALUES (?);', User.UID)
                    // add course of action to archive
                    await DBConnection.awaitQuery('INSERT INTO player_archive(UID, Username, Admin, Action, Message) VALUES (?, ?, ?, ?, ?);', [User.UID, User.Name, Admin.Name, 'Promoted', 'User has been promoted to administrator'])

                    WServer.WriteData(ConnectionId, 'adminpanel?1?' + User.Name + ' has been promoted successfully!');
                } else {
                    // Remove user from admins
                    await DBConnection.awaitQuery('DELETE FROM admins WHERE UID = ?', User.UID)
                    // add course of action to archive
                    await DBConnection.awaitQuery('INSERT INTO player_archive(UID, Username, Admin, Action, Message) VALUES (?, ?, ?, ?, ?)', [User.UID, User.Name, Admin.Name, 'Demoted', 'User has been demoted and is no longer an administrator'])

                    WServer.WriteData(ConnectionId, 'adminpanel?1?' + User.Name + ' has been demoted successfully!');
                }
            }
        }
    };

    async DeleteUser(ConnectionId, UID, io, socket) {
        // Retrieve caller info
        let result = await DBConnection.awaitQuery('SELECT users.UID, username FROM wbmm_users.users INNER JOIN admins ON ConnectionId = ? AND users.UID = admins.UID AND admins.HeadAdmin = 1;', ConnectionId)
        if (result.length > 0) { // Admin confirmed
            let Admin = {
                UID: result[0].UID,
                Name: result[0].username
            }
            let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE UID = ?;', UID)
            if (result.length > 0) {
                let User = {
                    UID: result[0].UID,
                    Name: result[0].username
                }
                // Delete user account
                await DBConnection.awaitQuery('DELETE FROM wbmm_users.users WHERE username = ?;', User.Name)
                // add course of action to archive
                await DBConnection.awaitQuery('INSERT INTO player_archive(UID, Username, Admin, Action, Message) VALUES (?, ?, ?, ?, ?)', [User.UID, User.Name, Admin.Name, 'Deleted', 'User has been deleted from the database'])
                WServer.WriteData(ConnectionId, 'adminpanel?1?' + User.Name + ' has been deleted successfully!');
            }
        }
    };

    async IgnoreReport(ConnectionId, ReportID, io, socket) {
        // Retrieve caller info
        let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE ConnectionId = ?;', ConnectionId)
        if (result.length > 0) {
            let Admin = {
                UID: result[0].UID,
                Name: result[0].username
            }
            let result = await DBConnection.awaitQuery('SELECT admins.UID FROM admins INNER JOIN wbmm_users.users ON admins.UID = users.UID WHERE admins.UID = ?;', Admin.UID)
            if (result.length > 0) { // Admin confirmed
                if (ReportID != 0)
                    await DBConnection.awaitQuery('UPDATE reports SET Solved = ? WHERE Id = ?;', ['Report has been ignored by ' + Admin.Name, ReportID])
                WServer.WriteData(ConnectionId, 'adminpanel?1?Report has been ignored successfully!');

            }
        }
    };

    async GlobalAnnouncement(ConnectionId, msg, io, socket) {
        if (msg.length != 0) {
            // Retrieve player UID
            let result = await DBConnection.awaitQuery('SELECT UID, username FROM wbmm_users.users WHERE ConnectionId = ?;', ConnectionId)
            if (result.length > 0) {
                let player = {
                    UID: result[0].UID,
                    Name: result[0].username
                }

                let result = await DBConnection.awaitQuery('SELECT admins.UID, users.username FROM admins INNER JOIN wbmm_users.users ON admins.UID = users.UID WHERE admins.UID = ?;', player.UID)
                if (result.length > 0) { // Admin confirmed
                    if (msg.length <= 200) {
                        // Select connection Ids for all players and broadcast message
                        let players = await DBConnection.awaitQuery('SELECT ConnectionId FROM wbmm_users.users WHERE ConnectionId IS NOT NULL;')
                        for (const row of players) {
                            WServer.WriteData(row.ConnectionId, 'announcementnotify?' + msg);
                        }
                        WServer.WriteData(ConnectionId, 'adminpanel?1?' + 'Announcement has been broadcasted successfully!');
                    }
                }
            }
        }
    };
}




export {
    FAdmin, FServer
}
