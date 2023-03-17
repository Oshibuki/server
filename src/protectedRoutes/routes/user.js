import express from 'express'
import { User } from '../../models/index.js'
let routes = express.Router();


routes.post('/', async (req, res) => {
    // 查询socketIO 当前region的玩家数 及正在进行中的匹配数
    try {
        const uid = req.body.uid
        if(!uid) {
            res.status(403).json({
                code:0,
                message:"uid is required"
            })
            return
        }
        const user =  await User.findOne({uid},{_id:0,__v:0})
        res.json({
            code:1,
            payload:user
        })
    } catch (error) {
        res.send("sql error:" + error)
    }
});



export default routes
