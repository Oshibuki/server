import express from 'express'
let routes = express.Router();

import write from 'write'
import calculate_dmg_percentage from '../../utils/getDamagePercent.js'
import { ActiveLobby, Server, SeasonStatus, PlayerStatus, MatchHistory } from '../../models/index.js'
import { Gamemode } from '../../constants/index.js';


routes.get('/', (req, res) => {
    let { type, server } = req.query;
    let io = req.io
    try {
        if (server == null || type == null) {
            res.send("type and server are required")
            return
        }
        
        if (type == "cancelled") {
            // Match cancelled
            res.send('302|2')
            setTimeout(cancelMatchProcedure, 3000, io,server)
        } else if (type == "ended") {
            res.send('302|1')
            setTimeout(endMatchProcedure, 1000)
        }



    } catch (error) {
        console.warn(error)
        res.send('SQL ERROR')
    }
});

async function cancelMatchProcedure(io,server) {
    
    const timerFile = `../timers/${server}.timer`;
    // Check who abandoned the match
    let players = await ActiveLobby.find({ lobbyID: server, abandoned: true })
    for (let player of players) {
        // Unlink friends
        // await ActiveLobby.updateMany({ friendUID: player.uid }, { friendUID: null })
        // Delete dodged players from lobby
        await ActiveLobby.findOneAndDelete({ uid: player.uid })
    }
    await ActiveLobby.updateMany({ lobbyID: server }, { team: 0, opponentsTeam: 0, lobbyStatus: false })
    // Reset counter and free server
    let currentServer = await Server.findOne({ lobbyID: server })
    let gamemode = currentServer.gamemode
    await Server.updateOne({ lobbyID: server }, {
        playersCount: 0,
        lobbyFull: false,
        lobbyReady: false,
        teamsAssigned: false,
        matchStarted: false
    })
    // Signal match cancelled to the client 
    write.sync(timerFile, 'matchcancelled', { overwrite: true });
    const now = new Date().toLocaleTimeString()
    if (gamemode == Gamemode.groupfight) {
        io.emit('chatMsg', {
            senderName: "Server",
            timeStamp: now,
            message: `A battle has been cancelled on ${server}!`
        })
    } else if (gamemode == Gamemode.battle) {
        io.emit('chatMsg', {
            senderName: "Server",
            timeStamp: now,
            message: `A groupfight has been cancelled on ${server}!`
        })
    }
    setTimeout(() => {
        write.sync(timerFile, 'matchsoon', { overwrite: true });
    }, 1000)
}

async function endMatchProcedure(io,server) {
    const timerFile = `../timers/${server}.timer`;
    let teamResults = await ActiveLobby.aggregate([{ $sort: { team: 1 } }, { $match: { lobbyID: server } }, { $group: { _id: "team", totalMMR: { $sum: "hiddenMMR" }, totalDamage: { $sum: "damage" } } }])
    let team1MMR = teamResults[0].totalMMR;
    let team1damage = teamResults[0].totalDamage;
    let team2MMR = teamResults[1].totalMMR;
    let team2damage = teamResults[1].totalDamage;



    // Retrieve scores
    let currentServer = await Server.findOne({ lobbyID: server })
    const { team1score, team2score, faction1, faction2, gamemode, map } = currentServer

    let playerRecords = await ActiveLobby.find({ "lobbyID": server })

    // Retrieve results and save stats
    
    const matchID = playerRecords[0].matchID
    for (const player of playerRecords) {
        const { uid, team, username, mmr, kills, teamkills, damage, teamDamage, hitsLanded, deaths } = player
        const tmpStatus = await SeasonStatus.findOne({ uid }, { "mmr": 1, "gmmr": 1 })
        const presetmmr = gamemode == Gamemode.battle ? tmpStatus.mmr : tmpStatus.gmmr
        let base_mmr = 0;
        const totalDamage = team == 1 ? team1damage : team2damage
        const damagepercentage = calculate_dmg_percentage(totalDamage, damage)
        if (team1score == team2score) {
            //draws+1
            //平局分数
            base_mmr = 0;
            base_mmr = base_mmr + (player.kills * 1.25); // kills pts
            base_mmr = base_mmr + (damagepercentage / 3); // damage pts
            base_mmr = base_mmr - ((deaths + teamkills) * 1.5);

            if (gamemode == Gamemode.battle) {
                SeasonStatus.findOneAndUpdate({ uid }, { bdraws: { $inc: 1 } })
                PlayerStatus.findOneAndUpdate({ uid }, { bdraws: { $inc: 1 } })
            } else if (gamemode == Gamemode.groupfight) {
                SeasonStatus.findOneAndUpdate({ uid }, { gdraws: { $inc: 1 } })
                PlayerStatus.findOneAndUpdate({ uid }, { gdraws: { $inc: 1 } })
            }
        } else if ((team == 1 && team1score > team2score) || (team == 2 && team1score < team2score)) {
            //wins+1
            // 胜则加分
            if ((team == 1 && team1MMR > team2MMR) || (team == 2 && team1MMR < team2MMR))
                base_mmr = 20;
            else
                base_mmr = 30;

            base_mmr = base_mmr + (kills * 1.25); // kills pts
            if (gamemode != 2)
                base_mmr = base_mmr + ((damagepercentage / 3)); // damage pts
            base_mmr = base_mmr - ((deaths + teamkills) * 1.5);
            base_mmr = base_mmr + ((team1score - team2score) * 2); // Rounds difference pts


            if (gamemode == Gamemode.battle) {
                SeasonStatus.findOneAndUpdate({ uid }, { bwins: { $inc: 1 } })
                PlayerStatus.findOneAndUpdate({ uid }, { bwins: { $inc: 1 } })
            } else if (gamemode == Gamemode.groupfight) {
                SeasonStatus.findOneAndUpdate({ uid }, { gwins: { $inc: 1 } })
                PlayerStatus.findOneAndUpdate({ uid }, { gwins: { $inc: 1 } })
            }
        } else if ((team == 1 && team1score < team2score) || (team == 2 && team1score > team2score)) {
            //loss+1
            //败则扣分
            if ((team == 2 && team1MMR > team2MMR) || (team == 1 && team1MMR < team2MMR))
                base_mmr = -30;
            else
                base_mmr = -20;

            base_mmr = base_mmr + (kills * 1.25);
            if (gamemode != 2)
                base_mmr = base_mmr + ((damagepercentage / 3)); // damage pts
            base_mmr = base_mmr - ((deaths + teamkills) * 1.5);
            base_mmr = base_mmr - ((team2score - team1score) * 2); // Rounds difference


            if (gamemode == Gamemode.battle) {
                SeasonStatus.findOneAndUpdate({ uid }, { blosses: { $inc: 1 } })
                PlayerStatus.findOneAndUpdate({ uid }, { blosses: { $inc: 1 } })
            } else if (gamemode == Gamemode.groupfight) {
                SeasonStatus.findOneAndUpdate({ uid }, { glosses: { $inc: 1 } })
                PlayerStatus.findOneAndUpdate({ uid }, { glosses: { $inc: 1 } })
            }
        }

        //结算分数到当前记录
        MatchHistory.insertOne({ matchID, uid, username, mmr: presetmmr + base_mmr, map, faction1, 
            faction2, kills, teamkills, deaths, damage, teamDamage, team1Score:team1score, team2Score:team2score, team, 
            mmrChange: base_mmr, gamemode, hitsLanded })
        const currentMMR = Math.max(0, mmr + base_mmr)
        if (gamemode == Gamemode.battle) {
            SeasonStatus.updateOne({ uid }, {
                mmr: currentMMR,
                bkills: { $inc: kills },
                bdeaths: { $inc: deaths },
                bteamkills: { $inc: teamkills },
                bTotalDamage:{ $inc: damage },
            })
            PlayerStatus.updateOne({ uid }, {
                mmr: currentMMR,
                bkills: { $inc: kills },
                bdeaths: { $inc: deaths },
                bteamkills: { $inc: teamkills },
                bTotalDamage:{ $inc: damage },
            })
        } else if (gamemode == Gamemode.groupfight) {
            SeasonStatus.updateOne({ uid }, {
                gmmr: currentMMR,
                gkills: { $inc: kills },
                gdeaths: { $inc: deaths },
                gteamkills: { $inc: teamkills },
                gTotalDamage:{ $inc: damage },
            })
            PlayerStatus.updateOne({ uid }, {
                gmmr: currentMMR,
                gkills: { $inc: kills },
                gdeaths: { $inc: deaths },
                gteamkills: { $inc: teamkills },
                gTotalDamage:{ $inc: damage },
            })
        }
    }

    write.sync(timerFile, 'matchresult', { overwrite: true });
    setTimeout(async () => {
        // Delete lobby players
        await ActiveLobby.deleteMany({ lobbyID: server })
        // Reset counter and free server
        await Server.updateOne({ lobbyID: server }, {
            lobbyFull: false,
            lobbyReady: false,
            playersCount: 0,
            team1Score: 0,
            team2Score: 0,
            teamsAssigned: false,
            matchStarted: false
        })
        // Signal match ended to the clients
        write.sync(timerFile, 'matchended', { overwrite: true });

        setTimeout(() => {
            // Reset timer
            write.sync(timerFile, 'matchsoon', { overwrite: true });
            if (gamemode == Gamemode.groupfight) {
                io.emit("servermsg", `A battle has just ended on ${server}!`)
            } else if (gamemode == Gamemode.battle) {
                io.emit("servermsg", `A groupfight has just ended on ${server}!`)
            }
        }, 2000)
    }, 12000)
}

export default routes
