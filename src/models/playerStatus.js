import mongoose from 'mongoose'

const PlayerStatusSchema = new mongoose.Schema({
    uid: String,
    username: String,
    gmmr: { type: Number, default: 1000 },
    mmr: { type: Number, default: 1000 },
    bwins: { type: Number, default: 0 },
    gwins: { type: Number, default: 0 },
    glosses: { type: Number, default: 0 },
    blosses: { type: Number, default: 0 },
    bdraws: { type: Number, default: 0 },
    gdraws: { type: Number, default: 0 },
    bkills: { type: Number, default: 0 },
    bteamkills: { type: Number, default: 0 },
    bdeaths: { type: Number, default: 0 },
    gkills: { type: Number, default: 0 },
    gteamkills: { type: Number, default: 0 },
    gdeaths: { type: Number, default: 0 },
    bTotalDamage:{ type: Number, default: 0 },
    gTotalDamage:{ type: Number, default: 0 },
})

export default mongoose.model('PlayerStatus', PlayerStatusSchema)
