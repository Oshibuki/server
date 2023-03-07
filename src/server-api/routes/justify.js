import express from 'express'
import write from 'write'
import { Server,User } from '../../models/index.js'
import readLinesFilter from '../../utils/readLinesFilter'
let routes = express.Router();


routes.get('/', async (req, res) => {
    let { uid,type,username,playerid } = req.query;
    try {
        if (type=="bancheck" && playerid ) {
            let user = await User.findOne({uid,banned:true})
            if(user){
                res.send(`600|${playerid}|${uid}`)
                return
            }
        }else  if (type=="ban" && username ) {
            await User.updateOne({uid,username},{banned:true})
            res.send(`${username} (${uid}) is successfully BANNED!`)
            return
        }else if (type=="unban" && username ) {
            await User.updateOne({uid,username},{banned:false})

            const ban_list = process.env.WBMM_BAN_LIST || "servers/ban_list.txt"
            const result = readLinesFilter(uid)
            write.sync(ban_list, result.join('\r\n'), { overwrite: true });
        
            res.send(`${username} (${uid}) is successfully UNBANNED! (You might need to remove him from the server banlist)`)
        }
    } catch (error) {
        console.log(error)
        res.send("sql error")
    }
});



export default routes;
