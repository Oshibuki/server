import express from 'express'
let matchMakingRouter = express.Router();

import matchstats  from './routes/matchstats.js'
import countdownset  from './routes/countdownset.js'
import endmatch  from './routes/endmatch.js'
import countdownforcestart  from './routes/countdownforcestart.js'
import countdown  from './routes/countdown.js'
import mainclass  from './routes/mainclass.js'
import justify  from './routes/justify.js'


import teamdamage  from './match/teamdamage.js'
import damage  from './match/damage.js'
import abandoned  from './match/abandoned.js'
import score  from './match/score.js'
import death  from './match/death.js'
import teamkill  from './match/teamkill.js'
import kill  from './match/kill.js'


matchMakingRouter.use('/matchstats', matchstats);
matchMakingRouter.use('/countdownset', countdownset);
matchMakingRouter.use('/endmatch', endmatch);
matchMakingRouter.use('/countdownforcestart', countdownforcestart);
matchMakingRouter.use('/countdown', countdown);
matchMakingRouter.use('/justify', justify);
matchMakingRouter.use('/whitelisting', whitelisting);
matchMakingRouter.use('/gamemode', gamemode);
matchMakingRouter.use('/mainclass', mainclass);


matchMakingRouter.use('/match/score', score);
matchMakingRouter.use('/match/death', death);
matchMakingRouter.use('/match/teamkill', teamkill);
matchMakingRouter.use('/match/kill', kill);
matchMakingRouter.use('/match/abandoned', abandoned);
matchMakingRouter.use('/match/teamdamage', teamdamage);
matchMakingRouter.use('/match/damage', damage);

export { matchMakingRouter};
