import express from 'express'
let routes = express.Router();

import { User } from '../../models/index.js'

routes.get('/',async function(req, res){
    let { uid, method,troop } = req.query;
    try {
        if (uid && method && troop) {
            if(method=="setclass"){
                await User.updateOne({uid},{mainClass:troop})
                res.send(1)
            }
        } 
    } catch (error) {
        console.log(error)
        res.send("sql error")
    }
});

export default routes;
