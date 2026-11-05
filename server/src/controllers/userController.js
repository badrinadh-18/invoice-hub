import { User } from '../models/User.js';

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
