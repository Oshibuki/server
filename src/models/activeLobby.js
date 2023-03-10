import mongoose from 'mongoose'

const ActiveLobbySchema = new mongoose.Schema({
    uid: String,
    friendUID: {type:String,default:null},
    lobbyID: String,
    username: String,
    lobbyStatus: {type:Boolean,default:false}, // is ready or not
    mmr: {type:Number,default:0},
    team: {type:Number,default:0},
    opponentsTeam: {type:Number,default:0},
    kills: {type:Number,default:0},
    teamkills: {type:Number,default:0},
    deaths: {type:Number,default:0},
    damage: {type:Number,default:0},
    teamDamage: {type:Number,default:0},
    abandoned: {type:Boolean,default:false},
    hitsLanded: {type:Number,default:0},
})

export default mongoose.model('ActiveLobby', ActiveLobbySchema)
