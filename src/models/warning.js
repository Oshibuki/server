import mongoose from 'mongoose';

const WarningSchema = new mongoose.Schema({
    uid: { type: String, default: null },
    username: { type: String, minLength: 2, maxLength: 15 },
    warning: { type: String, minLength: 2, maxLength: 60 },
    expired: { type: Date},
});

export default mongoose.model('Warning', WarningSchema);
