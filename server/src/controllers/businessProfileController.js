import { BusinessProfile } from '../models/BusinessProfile.js';

export const getBusinessProfile = async (req, res, next) => {
  try {
    const profile = await BusinessProfile.findOne({ ownerId: req.user._id });
    res.status(200).json({
      success: true,
      data: profile || null
    });
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateBusinessProfile = async (req, res, next) => {
  try {
    const data = { ...req.body, ownerId: req.user._id };

    const profile = await BusinessProfile.findOneAndUpdate(
      { ownerId: req.user._id },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Business profile saved successfully.',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
