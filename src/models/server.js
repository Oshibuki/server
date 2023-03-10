import mongoose from 'mongoose';
import { Factions, Regions} from '../constants/index.js'

const ServerSchema = new mongoose.Schema({
    playersCount: {type:Number,default:0},
    lobbyID: String,
    gamemode: {type:Number,default:6,enum:[6,12]},
    lobbyFull: {type:Boolean,default:false},
    teamsAssigned: {type:Boolean,default:false},
    lobbyReady: {type:Boolean,default:false},
    matchStarted: {type:Boolean,default:false},
    team1Score: {type:Number,default:0},
    team2Score: {type:Number,default:0},
    map: String,
    faction1: { type: String, enum: Factions },
    faction2: { type: String, enum: Factions },
    region: { type: String, enum: Regions },
});

export default mongoose.model('Server', ServerSchema);
