import mongoose from 'mongoose';

const PlayerArchiveSchema = new mongoose.Schema({
    uid: String,
    username: String,
    adminUID: String,
    adminName: String,
    action: String,
    message: String,
});

export default mongoose.model('PlayerArchive', PlayerArchiveSchema);
