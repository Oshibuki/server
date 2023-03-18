import express from 'express'
let routes = express.Router();

import { ActiveLobby, Server } from '../../models/index.js'

routes.get('/',async function(req, res){
    let { server, uid, type, team1, team2 } = req.query;
    try {
        if (!server) {
            res.send('No server provided!')
        } else if (!uid) {
            res.send('No server provided!')
        } else {
            
            if (["kill", "death", "teamkill"].includes(type)) {
                await ActiveLobby.findOne({ uid }).update({ [type]: { $inc: 1 } })
            } else if (type == "score") {
                team1 = parseInt(team1)
                team2 = parseInt(team2)
                await Server.findOne({ lobbyID:server }).update({
                    team1Score: { $inc: team1 },
                    team2Score: { $inc: team2 }
                })
            } else if (type == "abandoned") {
                await ActiveLobby.findOne({ uid }).update({ abandoned:false })
            }
            res.end()
        }
    } catch (error) {
        console.log(error)
        res.send("sql error")
    }
});

export default routes;
