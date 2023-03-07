import mongoose from 'mongoose';

const BanSchema = new mongoose.Schema({
    uid: { type: String},
    username:String,
    banReason: { type: String, default: "" },
    banStart: { type: Date},
    banEnd: { type: Date },
});

export default mongoose.model('Ban', BanSchema);
