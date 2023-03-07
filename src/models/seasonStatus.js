import mongoose from 'mongoose'

const SeasonStatusSchema = new mongoose.Schema({
    uid:String,
    username:String,
    NameChanged:{type:Boolean,default:false},
    gmmr:{ type: Number, default: 1000 },
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
    top25: {type:Boolean,default:false},
    topgold: {type:Boolean,default:false},
    topsilver: {type:Boolean,default:false},
    topbronze: {type:Boolean,default:false},
    topgroupfight: {type:Boolean,default:false},
    topduel: {type:Boolean,default:false},
    totalDamage:{ type: Number, default: 0 }
})

export default mongoose.model('SeasonStatus', SeasonStatusSchema)
