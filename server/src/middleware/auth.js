import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header first
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Check HttpOnly cookie
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required to access this resource.'
        }
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The user belonging to this token no longer exists.'
        }
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact administrator support.'
        }
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account is deactivated. Please contact support to reactivate.'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session has expired or token is invalid. Please sign in again.'
        }
      });
    }

    next(error);
  }
};
