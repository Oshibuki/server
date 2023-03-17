import mongoose from 'mongoose'

const ActiveLobbySchema = new mongoose.Schema({
    uid: {type:String,required:true},
    friendUID: {type:String,default:null},
    region:String,
    lobbyID: String,
    username: String,
    lobbyStatus: {type:Boolean,default:false}, // is ready or not
    mmr: {type:Number,default:0},
    kdRate:{type:Number,default:0},
    winRate:{type:Number,default:0},
    team: {type:Number,default:0},
    opponentsTeam: {type:Number,default:0},
    kills: {type:Number,default:0},
    teamkills: {type:Number,default:0},
    deaths: {type:Number,default:0},
    damage: {type:Number,default:0},
    teamDamage: {type:Number,default:0},
    abandoned: {type:Boolean,default:false},
    hitsLanded: {type:Number,default:0},
    matchID: {type:String,default:null}
})

export default mongoose.model('ActiveLobby', ActiveLobbySchema)
