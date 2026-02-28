import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDB() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}
