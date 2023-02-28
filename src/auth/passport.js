import LocalStrategy from 'passport-local';
import passport from 'passport'
import mongodb from 'mongodb';
const { ObjectId } = mongodb;
import User from '../models/user.js';


export default function (app) {

    app.use(passport.initialize());
    app.use(passport.session());
  
    passport.use(new LocalStrategy((username, password, done) => {
        User.findOne({ username: username }, (err, user) => {
          console.log(`User ${username} attempted to log in.`);
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
        //   if (!bcrypt.compareSync(password, user.password))
          if (password !=user.password) { 
            return done(null, false);
          }
          return done(null, user);
        });
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
