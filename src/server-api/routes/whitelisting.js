import express from 'express'
import write from 'write'
import { PlayerStatus, SeasonStatus, User, Server, ActiveLobby } from '../../models/index.js'
import { Gamemode } from '../../constants/index.js';
let routes = express.Router();


routes.get('/', async (req, res) => {
    let { uid, username, playerid, server, set } = req.query;
    server = server.slice(5)
    try {
        if (!uid || !username){
            res.send('No UID or player name provided!')
            return
        }
        let user = await User.findOne({ username })
        if(!user){
            res.send(`200|${playerid}`)
            return
        }
        // Check if username exists, if yes then verify uid
        if (user.uid == "initial") { //(not registered) then register his uid
            // Check if UID is already registered
            let tmp = await User.findOne({ uid })
            if (tmp) {
                res.send(`200|${playerid}`)
                return
            }

            // Insert player uid into DB
            await User.updateOne({ username }, { uid })
            // Create stats for player
            await PlayerStatus.findOneAndUpdate({ uid }, { uid, username }, { upsert: true })
            // Create stats for season
            await SeasonStatus.findOneAndUpdate({ uid }, { uid, username }, { upsert: true })
            res.send(`200|${playerid}`)
            return
        } else {
            // Player is already registered

            // Check if its an admin
            const isAdmin = user.isAdmin ? 1 : 0;

            const currentServer = await Server.findOne({ lobbyID: server, matchStarted: true })
            if(!currentServer){
                res.send(`200|${playerid}|${isAdmin}`)
                return
            }
            
            const { uid, team } = await ActiveLobby.findOne({ lobbyID: server, uid, username })
            if (!user) {
                res.send(`200|${playerid}|${isAdmin}`)
                return
            }
            if (set == 1) {
                if (team == 1) {
                    team = 0;
                } else if(team == 2){
                    team = 1;
                }
            } else {
                if (team == 1) {
                    team = 1;
                } else if(team == 2){
                    team = 0;
                }
            }
            // Season MMR
            const seasonStatus = SeasonStatus.findOne({ uid })
            const currentMMR = currentServer.gamemode == Gamemode.battle ? seasonStatus.mmr : gamemode == Gamemode.groupfight ? seasonStatus.gmmr : 0
            const rank = getRank(currentMMR)
            res.send(`100|${playerid}|${team}|0|${rank}|${currentMMR}|${isAdmin}`)
            return


        }
    } catch (error) {
        console.log(error)
        res.send("sql error")
    }
});



export default routes;
