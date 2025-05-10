import mongoose from 'mongoose';
import { config } from './index';

export async function connectToDatabase() {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
} 