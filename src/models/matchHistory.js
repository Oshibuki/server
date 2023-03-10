import mongoose from 'mongoose'
import { Factions} from '../constants/index.js'

const MatchHistorySchema = new mongoose.Schema({
        matchId:{type:String,required:true},
        uid: String,
        username: String,
        mmr: Number,
        map: String,
        faction1: { type: String},
        faction2: { type: String},
        kills: Number,
        teamkills: Number,
        deaths: Number,
        damage: Number,
        teamdamage: Number,
        team1Score: Number,
        team2Score: Number,
        team: Number,
        mmrChange: Number,
        gamemode: Number,
        hitsLanded: Number
})

export default mongoose.model('MatchHistory', MatchHistorySchema)
