// Do not change this file
import dotenv from 'dotenv';
dotenv.config()
import mongoose from 'mongoose';

export default async function(callback) {
    const URI = process.env.MONGO_URI; // Declare MONGO_URI in your .env file

    try {
        // Connect to the MongoDB cluster
        await mongoose.connect(URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
          });
          
        // Make the appropriate DB calls
        await callback();

    } catch (e) {
        // Catch any errors
        console.error(e);
        throw new Error('Unable to Connect to Database')
    }
}
