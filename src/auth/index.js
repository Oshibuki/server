import passport from './passport.js';
import localauth from './local-auth.js'


export default function (app) {
    passport(app )
    localauth(app)
}
