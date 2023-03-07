import mongoose from 'mongoose';
import Regions from "../constants/regions.js"
import Troops from "../constants/troops.js"

const UserSchema = new mongoose.Schema({
    connectionId: { type: String, default: null },
    region: { type: String, enum: Regions },
    uid: { type: String, default: "initial" },
    username: { type: String, minLength: 2, maxLength: 15 },
    password: { type: String, minLength: 8, maxLength: 60 },
    lastActive: { type: Date, default: Date.now },
    announcement: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },
    banStart: { type: Date},
    banEnd: { type: Date },
    mainClass: { type: String, 
        // enum: Troops
     },
    iPAddress: {type:Number},
    isAdmin: { type: Boolean, default: false },
    isHeadAdmin: { type: Boolean, default: false },
});

export default mongoose.model('User', UserSchema);
