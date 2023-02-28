var express = require('express')
var rootRouter = express.Router();

import matchstats  from './routes/matchstats'
import countdownset  from './routes/countdownset'


rootRouter.use('/matchstats', matchstats);
rootRouter.use('/countdownset', countdownset);
// rootRouter.use('/endmatch', endmatch);
// rootRouter.use('/countdownforcestart', countdownforcestart);
// rootRouter.use('/countdown', countdown);
// rootRouter.use('/justify', justify);
// rootRouter.use('/whitelisting', whitelisting);
// rootRouter.use('/gamemode', gamemode);
// rootRouter.use('/mainclass', mainclass);


// rootRouter.use('/match/score', score);
// rootRouter.use('/match/death', death);
// rootRouter.use('/match/teamkill', teamkill);
// rootRouter.use('/match/kill', kill);
// rootRouter.use('/match/abandoned', abandoned);
// rootRouter.use('/match/teamdamage', teamdamage);
// rootRouter.use('/match/damage', damage);



export default rootRouter;
