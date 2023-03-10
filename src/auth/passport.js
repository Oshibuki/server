import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const passport = require("passport");
import User from '../models/user.js';


export default function (app) {

    app.use(passport.initialize());
    app.use(passport.session());
  
    const LocalStrategy = require('passport-local').Strategy;
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

}
