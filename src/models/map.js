import mongoose from 'mongoose';

const MapSchema = new mongoose.Schema({
    mapName: String,
    active: Boolean
});

export default mongoose.model('serverMap', MapSchema);
