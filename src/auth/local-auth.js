import passport from 'passport'
import User from '../models/user.js';
import { PlayerStatus, SeasonStatus, Warning } from '../models/index.js';

export default function (app) {

    app.post("/api/user/login", function (req, res) {
        if (!req.body.username) {
            res.json({ code: 0, message: "Username was not given" })
        }
        else if (!req.body.password) {
            res.json({ code: 0, message: "Password was not given" })
        }
        else {
            passport.authenticate("local", async function (err, user) {
                if (err) {
                    console.log(err)
                    res.json({ code: 0, message: err });
                }
                else {
                    if (!user) {
                        res.json({ code: 0, message: "username or password incorrect" });
                    }
                    else {
                        const { uid, username, region, createAt, banned, banReason, banStart, banEnd, mainClass, isAdmin, isHeadAdmin } = user
                        //未激活
                        if(uid=="initial"){
                            res.json({
                                code:0,
                                message:"You must join a WBMM server under your username to register your unique ID."
                            })
                            return
                        }

                        //是否被永ban
                        const now = new Date()
                        if(banned && banStart==null && banEnd==null){
                            res.json({
                                code:0,
                                message:'You have been banned permanently. You may request an appeal on the WBMM forum.'
                            })
                            return
                        }else if(banned && banStart<=now && banEnd>=now){
                            res.json({
                                code:0,
                                message:`You have been banned. Your ban will be lasting to ${banEnd.toLocaleDateString()} ${banEnd.toLocaleTimeString()}`
                            })
                            return
                        }

                        //更新ip记录
                        if (!user.iPAddress.includes(req.clientIp)) {
                            await User.updateOne({ uid}, { $push: { iPAddress: req.clientIp }, $currentDate: { lastActive: true } })
                        } else {
                            await User.updateOne({ uid: user.uid }, { $currentDate: { lastActive: true } })
                        }

                        // Remove expired warnings
                        await Warning.deleteMany({uid,expired:{$lt:now}})

                        // Check if season and general stats 
                        let playerStatus = await PlayerStatus.findOne({uid})
                        if(!playerStatus){
                            PlayerStatus.insertOne({uid,username})
                        }
                        let seasonStatus = await SeasonStatus.findOne({uid})
                        if(!seasonStatus){
                            SeasonStatus.insertOne({uid,username})
                        }
                        res.json({
                            code: 1, message: "Authentication successful", payload: {
                                uid, username, region, createAt, banned, banReason, banStart, banEnd, mainClass, isAdmin, isHeadAdmin
                            }
                        });
                    }
                }
            })(req, res);
        }
    });


    app.route('/api/user/logout')
        .post(async (req, res) => {
            if (req.session) {
                await req.logout()
                await req.session.destroy();
            }
            res.send("log out success");
        });

    app.route('/api/user/register')
        .post((req, res) => {
            User.register(new User({ username: req.body.username, region: req.body.region, createAt: new Date() }), req.body.password, function (err, user) {
                if (err) {
                    res.json({ code: 0, message: "Your account could not be saved. Error: " + err });
                }
                else {
                    req.login(user, (er) => {
                        if (er) {
                            res.json({ code: 0, message: er });
                        }
                        else {
                            res.json({ code: 1, message: "Your account has been created. You may now join any WBMM server under the nickname <b>'"+req.body.username+"'</b> to register your UID in order to complete registration." });
                        }
                    });
                }
            });

        });

}
