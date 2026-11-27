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
    const { email, frontendUrl } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Verify if email is in our users list
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found with this email address. Please check the spelling or create an account.'
        }
      });
    }

    // Invalidate existing unused reset tokens for this user
    await PasswordReset.updateMany(
      { userId: user._id, used: false },
      { $set: { used: true } }
    );

    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(plainToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour validity

    await PasswordReset.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      used: false
    });

    // Resolve base frontend URL
    let frontendBase = frontendUrl || req.headers.origin || process.env.FRONTEND_URL;
    if (!frontendBase && req.headers.referer) {
      try {
        const parsed = new URL(req.headers.referer);
        frontendBase = parsed.origin;
      } catch (e) {}
    }
    if (!frontendBase || frontendBase.includes('localhost:5001')) {
      frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    }

    const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password/${plainToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your InvoiceHub Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table role="presentation" style="width: 100%; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" cellpadding="0" cellspacing="0">
    <tr>
      <td style="background-color: #0f766e; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Invoice<span style="color: #99f6e4;">Hub</span></h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Password Reset Request</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${user.name || 'User'}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">We received a request to reset the password for your InvoiceHub account (<code>${user.email}</code>).</p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #0f766e; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(15,118,110,0.2);" target="_blank">Reset Your Password</a>
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: #64748b;">This password reset link is valid for <strong>60 minutes</strong>. If you did not request a password reset, you can safely disregard this email; your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">If the button above does not work, copy and paste this link into your web browser:</p>
        <p style="font-size: 12px; word-break: break-all; margin: 0;"><a href="${resetUrl}" style="color: #0f766e;">${resetUrl}</a></p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 28px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">© ${new Date().getFullYear()} InvoiceHub • Secure Billing & Invoicing Platform</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    try {
      await sendEmail(user.email, 'Reset Your InvoiceHub Password', html);
    } catch (mailErr) {
      console.error('Email dispatch error:', mailErr);
    }

    // Securely return success without exposing resetUrl on the screen
    return res.status(200).json({
      success: true,
      message: `A secure password reset link has been sent to ${user.email}. Please check your email inbox to change your password.`
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential, email: inputEmail, name: inputName, googleId: inputGoogleId, avatar: inputAvatar } = req.body;

    let email = inputEmail;
    let name = inputName;
    let googleId = inputGoogleId;
    let avatar = inputAvatar;

    // Decode Google JWT if credential token is supplied
    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email) {
            email = payload.email;
            name = payload.name || name;
            googleId = payload.sub || googleId;
            avatar = payload.picture || avatar;
          }
        }
      } catch (parseErr) {
        console.warn('Could not decode Google token payload:', parseErr);
      }
    }

    if (!email) {
      return res.status(400).json({
        error: { code: 'INVALID_GOOGLE_AUTH', message: 'Valid Google / Gmail address is required.' }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // If user exists, connect Google ID if missing
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account is suspended. Please contact administrator support.' }
        });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({
          error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is inactive. Please contact support.' }
        });
      }

      await logAuditEvent({
        actorId: user._id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_LOGGED_IN_GOOGLE',
        targetType: 'User',
        targetId: user._id,
        ip: req.ip,
      });

      return sendTokenResponse(user, 200, res);
    }

    // User does not exist: Automatically register using Gmail
    const randomPass = crypto.randomBytes(32).toString('hex');
    const passwordHash = await User.hashPassword(randomPass);

    user = await User.create({
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      passwordHash,
      googleId,
      avatar,
      authProvider: 'google',
      role: 'user',
      status: 'active'
    });

    await logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED_GOOGLE',
      targetType: 'User',
      targetId: user._id,
      ip: req.ip,
    });

    return sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }
    const tokenHash = hashToken(token);
    const record = await PasswordReset.findOne({ tokenHash, used: false, expiresAt: { $gt: new Date() } });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link.' });
    }
    const user = await User.findById(record.userId).select('email name');
    return res.status(200).json({
      success: true,
      message: 'Valid token.',
      email: user?.email || '',
      name: user?.name || ''
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to validate reset link.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }
    const tokenHash = hashToken(token);
    const record = await PasswordReset.findOne({ tokenHash, used: false, expiresAt: { $gt: new Date() } });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token. Please request a new link.' });
    }
    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Associated user account not found.' });
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

    return res.status(200).json({ success: true, message: 'Password has been reset successfully. You can now sign in with your new password.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Current password and new password are required.' }
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: { code: 'INVALID_PASSWORD', message: 'New password must be at least 6 characters long.' }
      });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        error: { code: 'INCORRECT_PASSWORD', message: 'The current password you entered is incorrect.' }
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    await logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_CHANGED',
      targetType: 'User',
      targetId: user._id,
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Your password has been changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};
