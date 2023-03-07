import mongoose from 'mongoose';

const FriendSchema = new mongoose.Schema({
    uid: { type: String, default: null },
    friendUid:{ type: String, default: null },
    status: Boolean,
    paired: { type: Boolean, default: false },
    friendName: String
});

export default mongoose.model('Friend', FriendSchema);
