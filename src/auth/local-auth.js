import passport from 'passport'
import User from '../models/user.js';

export default function (app) {

    app.route('/login').post(passport.authenticate('local', {
        failureRedirect: '/'
    }), (req, res) => {
        res.redirect('/profile');
    })

    app.route('/logout')
        .get((req, res) => {
            if (req.session) {
                req.session.destroy();
              }
            res.redirect('/');
        });

    app.route('/register')
        .post((req, res, next) => {
            // const hash = bcrypt.hashSync(req.body.password, 12)
            let { username, password } = req.body
            if (!username) {
                res.json({
                    status:0,
                    msg:'Please enter your username.'
                })
                return
            }
            if (!password) {
                res.json({
                    status:0,
                    msg:'Please enter your password.'
                })
                return
            }
            if (username.length < 3 || username.length > 15) {
                res.json({
                    status:0,
                    msg:'Username must be between 3 and 15 characters.'
                })
                return
            }

            User.find({ username }).where('uid').ne(null).exec(function (err, user) {
                if (err) {
                    next(err)
                } else if (user.length==1) {
                    res.json({
                        status:0,
                        msg:'Username already taken!'
                    })
                    res.send('0:' + "")
                } else {
                    User.create({
                        username,
                        password,
                        uid: 0
                    },
                        (err, user) => {
                            if (err) {
                                res.send("0:SQL create new user Error");
                            } else {
                                // The inserted document is held within
                                // the ops property of the doc
                                res.json({
                                    status:1,
                                    msg:"Your account has been created. You may now join any WBMM mountblade server under the nickname <b>'" + username + "'</b> to register your UID in order to complete registration."
                                })
                                next(null, user);
                            }
                        }
                    )
                }
            })

        });

}
