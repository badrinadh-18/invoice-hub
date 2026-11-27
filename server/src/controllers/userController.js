import { User } from '../models/User.js';
import { Invoice } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';
import { BusinessProfile } from '../models/BusinessProfile.js';
import { Payment } from '../models/Payment.js';
import { PasswordReset } from '../models/PasswordReset.js';
import { logAuditEvent } from '../services/auditService.js';

export const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      createdAt: req.user.createdAt
    }
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found.'
        }
      });
    }

    if (name) {
      user.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: {
            code: 'CURRENT_PASSWORD_REQUIRED',
            message: 'Current password is required to set a new password.'
          }
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CURRENT_PASSWORD',
            message: 'Incorrect current password.'
          }
        });
      }

      user.passwordHash = await User.hashPassword(newPassword);
    }

    // Role and status cannot be modified here
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { password, confirmation } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User account not found.' }
      });
    }

    // Safety guard: Prevent deleting the last active administrator
    if (user.role === 'admin') {
      const activeAdminsCount = await User.countDocuments({
        role: 'admin',
        status: 'active'
      });
      if (activeAdminsCount <= 1) {
        return res.status(400).json({
          error: {
            code: 'CANNOT_DELETE_LAST_ADMIN',
            message: 'Cannot delete the only active administrator account.'
          }
        });
      }
    }

    // Password verification for password-protected accounts
    if (user.passwordHash) {
      if (!password) {
        return res.status(400).json({
          error: {
            code: 'PASSWORD_REQUIRED',
            message: 'Please enter your account password to confirm deletion.'
          }
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Incorrect password. Account deletion cancelled.'
          }
        });
      }
    } else {
      // For Google OAuth accounts without password, require typing DELETE or their email
      if (confirmation !== 'DELETE' && confirmation !== user.email) {
        return res.status(400).json({
          error: {
            code: 'CONFIRMATION_REQUIRED',
            message: 'Please type DELETE to confirm permanent account deletion.'
          }
        });
      }
    }

    // Cascade delete all tenant records
    await Promise.all([
      Invoice.deleteMany({ ownerId: userId }),
      Customer.deleteMany({ ownerId: userId }),
      BusinessProfile.deleteMany({ ownerId: userId }),
      Payment.deleteMany({ ownerId: userId }),
      PasswordReset.deleteMany({ userId: userId }),
      User.findByIdAndDelete(userId)
    ]);

    await logAuditEvent({
      actorId: userId,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_ACCOUNT_SELF_DELETED',
      targetType: 'User',
      targetId: userId,
      reason: 'User permanently deleted their account from account settings',
      ip: req.ip
    });

    res.clearCookie('token');

    return res.status(200).json({
      success: true,
      message: 'Your account and all associated billing records have been permanently deleted.'
    });
  } catch (error) {
    next(error);
  }
};
