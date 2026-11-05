import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/invoicehub',
  jwtSecret: process.env.JWT_SECRET || 'invoicehub_super_secret_jwt_key_2026_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};
