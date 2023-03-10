import express from 'express'
import { PlayerStatus } from '../../models/index.js'
let routes = express.Router();


routes.post('/', async (req, res) => {
    try{  
        const uid = req.body.uid
        const playerStatus =  await PlayerStatus.findOne({uid},{"_id":0,"__v":0})
        if(playerStatus){
            res.json({
                code:1,
                payload:playerStatus
            })
        }else {
            res.json({
                code:0,
                message:"not found"
            })
        }
        
    } catch (error) {
        res.send("sql error:" + error)
    }
});



export default routes;

