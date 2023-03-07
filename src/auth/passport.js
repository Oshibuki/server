import LocalStrategy from 'passport-local';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const passport = require("passport");
import mongodb from 'mongodb';
const { ObjectId } = mongodb;
import User from '../models/user.js';


export default function (app) {

    app.use(passport.initialize());
    app.use(passport.session());
  
    passport.use(new LocalStrategy((username, password, done) => {
        
        //   if (!bcrypt.compareSync(password, user.password))
        let user = User.findOne({username,password})
        if (user) {
            done(null, user)
        } else {
            done(null, false, { message: 'Incorrect username or password'})
        }
      }));
  
  
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });
    
    passport.deserializeUser((id, done) => {
      User.findOne({ _id: new ObjectId(id) }, (err, doc) => {
        done(null, doc);
      });
    });
}
