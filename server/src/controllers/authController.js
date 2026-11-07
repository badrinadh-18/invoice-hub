import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { PasswordReset, hashToken } from '../models/PasswordReset.js';
import { config } from '../config/env.js';
import { logAuditEvent } from '../services/auditService.js';
import { sendEmail } from '../services/emailService.js';

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(Date.now() + config.cookieMaxAge),
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
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
      status: user.status,
    },
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
          message: 'An account with this email address already exists.',
        },
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      status: 'active',
    });

    await logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      targetType: 'User',
      targetId: user._id,
      ip: req.ip,
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
          message: 'Invalid email or password.',
        },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logAuditEvent({
        action: 'LOGIN_FAILED',
        targetType: 'User',
        targetId: user._id,
        reason: 'Incorrect password',
        ip: req.ip,
      });

      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account is suspended. Please contact administrator support.',
        },
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account is deactivated. Please contact support.',
        },
      });
    }

    logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGGED_IN',
      targetType: 'User',
      targetId: user._id,
      ip: req.ip,
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
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
      createdAt: req.user.createdAt,
    },
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    }
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(plainToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await PasswordReset.create({ userId: user._id, tokenHash, expiresAt, used: false });
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${plainToken}`;
    const html = `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`;
    await sendEmail(user.email, 'Password Reset', html);
    return res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
  }
};

export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = hashToken(token);
    const record = await PasswordReset.findOne({ tokenHash, used: false, expiresAt: { $gt: new Date() } });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }
    return res.status(200).json({ success: true, message: 'Valid token.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to validate token.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }
    const tokenHash = hashToken(token);
    const record = await PasswordReset.findOne({ tokenHash, used: false, expiresAt: { $gt: new Date() } });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }
    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    user.passwordHash = await User.hashPassword(password);
    await user.save();
    record.used = true;
    await record.save();

    await logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      targetType: 'User',
      targetId: user._id,
      ip: req.ip,
    });

    return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};
