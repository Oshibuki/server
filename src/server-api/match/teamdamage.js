import express from 'express'
let routes = express.Router();

import { ActiveLobby } from '../../models/index.js'

routes.get('/',async function(req, res){
    let { server, uid, dmg:damage } = req.query;
    try {
        if (!server || !uid || !damage) {
            throw Error('Invalid parameters!')
        }else {
            
            await ActiveLobby.updateOne({uid},{teamDamage:{$inc:damage},hitsLanded:{$inc:1}})
            res.end()
        }
    } catch (error) {
        res.send(error)
    }
});

export default routes;
