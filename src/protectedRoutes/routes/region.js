import express from 'express'
import { Server } from '../../models/index.js'
import { Gamemode } from '../../constants/index.js';
let routes = express.Router();


routes.post('/', async (req, res) => {
    // 查询socketIO 当前region的玩家数 及正在进行中的匹配数
    try {
        const io  = req.io
        const region = req.body.region
        if(!io || !region) {
            res.json({
                code:0,
                message:"socket and region are both required"
            })
            return
        }
        const regionUserCount = io.sockets.adapter.rooms.get(region)
        // const battleServersCount = (await Server.find({region,gamemode:Gamemode.battle})).length
        // const groupfightServersCount = (await Server.find({region,gamemode:Gamemode.groupfight})).length
        res.json({
            code:1,
            payload:{
                regionUserCount,
                // battleServersCount,
                // groupfightServersCount
            }
        })
    } catch (error) {
        res.send("sql error:" + error)
    }
});



export default routes
