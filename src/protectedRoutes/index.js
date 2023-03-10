import express from 'express'
const apiRouter = express.Router();

import season from './routes/season.js'
import player from './routes/player.js'
import region from './routes/region.js'


apiRouter.use('/region/status', region);
apiRouter.use('/season/status', season);
apiRouter.use('/player/status', player);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).send('You are not authenticated')
};

export { apiRouter };









