import express from 'express'
const apiRouter = express.Router();
import {User} from '../models/index.js'

import season from './routes/season.js'
import player from './routes/player.js'
import user from './routes/user.js'


apiRouter.use('/season/status',ensureAuthenticated, season);
apiRouter.use('/player/status',ensureAuthenticated, player);
apiRouter.use('/user/status',ensureAuthenticated, user);

function ensureAuthenticated(req, res, next) {
    if (User.countDocuments({uid:req.body.uid})) {
        return next();
    }
    res.status(401).send('You are not authenticated')
}

export { apiRouter };









