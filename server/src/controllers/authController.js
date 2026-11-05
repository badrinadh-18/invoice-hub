import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { logAuditEvent } from '../services/auditService.js';

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(Date.now() + config.cookieMaxAge),
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax'
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists.'
        }
      });
    }

    const passwordHash = await User.hashPassword(password);

    // Regular users are ALWAYS created with role 'user'
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      status: 'active'
    });

    await logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      targetType: 'User',
      targetId: user._id,
      ip: req.ip
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAuditEvent({
        action: 'LOGIN_FAILED',
        targetType: 'User',
        targetId: user._id,
        reason: 'Incorrect password',
        ip: req.ip
      });

      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account is suspended. Please contact administrator support.'
        }
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account is deactivated. Please contact support.'
        }
      });
    }

    await logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGGED_IN',
      targetType: 'User',
      targetId: user._id,
      ip: req.ip
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      createdAt: req.user.createdAt
    }
  });
};

export const forgotPassword = async (req, res) => {
  // Safe message conforming to requirement: if external email not configured, state clear status
  res.status(200).json({
    success: true,
    message: 'If the provided email is registered, password reset instructions will be sent. (Note: Email service integration requires SMTP credentials; in development mode, please contact the administrator).'
  });
};
