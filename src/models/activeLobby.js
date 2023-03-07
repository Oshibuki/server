import mongoose from 'mongoose'

const ActiveLobbySchema = new mongoose.Schema({
    uid: String,
    friendUID: String,
    lobbyID: String,
    username: String,
    lobbyStatus: {type:Boolean,default:false},
    mmr: Number,
    hiddenMMR: Number,
    team: Number,
    opponentsTeam: Number,
    kills: Number,
    teamkills: Number,
    deaths: Number,
    damage: Number,
    teamDamage: Number,
    abandoned: {type:Boolean,default:false},
    hitsLanded: Number,
})

export default mongoose.model('ActiveLobby', ActiveLobbySchema)
