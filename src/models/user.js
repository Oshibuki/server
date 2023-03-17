import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose'
import Regions from "../constants/regions.js"

const UserSchema = new mongoose.Schema({
    region: { type: String, enum: Regions },
    connectionId: { type: String, default: null },
    uid: { type: String, default: "initial" },
    username: { type: String, minLength: 2, maxLength: 15 },
    lastActive: { type: Date, default: new Date() },
    announcement: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },
    banStart: { type: Date},
    banEnd: { type: Date },
    createAt: { type: Date, default: new Date() },
    mainClass: { type: String, 
        // enum: Troops
     },
    iPAddress:{
        type: [String],
        default: [],
      },
    isAdmin: { type: Boolean, default: false },
    isHeadAdmin: { type: Boolean, default: false },
});

UserSchema.plugin(passportLocalMongoose);

export default mongoose.model('User', UserSchema);
