import express from 'express'
import { SeasonStatus } from '../../models/index.js'
let routes = express.Router();


routes.post('/', async (req, res) => {
    try{  
        const uid = req.body.uid
        const seasonStatus =  await SeasonStatus.findOne({uid},{"_id":0,"__v":0})
        if(seasonStatus){
            res.json({
                code:1,
                payload:seasonStatus
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

