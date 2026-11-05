import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import businessProfileRoutes from './routes/businessProfileRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration with credentials support
const allowedOrigins = [
  config.corsOrigin,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev if needed
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Body and cookie parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Rate limiting for sensitive authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
  }
});

// Mount routes under /api/v1
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/business-profile', businessProfileRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all 404 for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `The requested endpoint ${req.originalUrl} does not exist.`
    }
  });
});

// Central error handler
app.use(errorHandler);

export default app;
