import express from 'express'
let routes = express.Router();

import { Server } from '../../models/index.js'

routes.get('/',async function(req, res){
    let { server, team1:team1Score,team2:team2Score } = req.query;
    try {
        if (!server || !uid ) {
            throw Error('Invalid parameters!')
        }else {
            server = server.slice(5)
            await Server.updateOne({lobbyID:server},{team1Score:{$inc:team1Score},team2Score:{$inc:team2Score}})
            res.end()
        }
    } catch (error) {
        res.send(error)
    }
});

export default routes;