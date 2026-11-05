import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] Failed to connect: ${error.message}`);
    process.exit(1);
  }
};
