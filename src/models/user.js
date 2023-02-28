import mongoose from 'mongoose';
import Regions from "../constants/regions.js"
import Troops from "../constants/troops.js"

const UserSchema = new mongoose.Schema({
    ConnectionId: { type: String, default: null },
    Region: { type: String, enum: Regions },
    uid: { type: String, default: null },
    username: { type: String, minLength: 2, maxLength: 15 },
    password: { type: String, minLength: 8, maxLength: 60 },
    LastActive: { type: Date, default: Date.now },

    Announcement: { type: Boolean, default: false },
    Banned: { type: Boolean, default: false },
    BanReason: { type: String, default: "" },
    BanStart: { type: Date, default: Date.now },
    BanEnd: { type: Date },
    MainClass: { type: String, enum: Troops },
    IPAddress: {type:Number},
    Created_at:{ type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
