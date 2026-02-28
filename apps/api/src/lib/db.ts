import mongoose from 'mongoose';
import { config } from './config.js';

let connectPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = mongoose.connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    family: 4
  });

  try {
    const conn = await connectPromise;
    console.log('✅ Connected to MongoDB');
    return conn;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    connectPromise = null;
    throw err;
  }
}
