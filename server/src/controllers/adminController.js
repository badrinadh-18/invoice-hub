import { User } from '../models/User.js';
import { Invoice } from '../models/Invoice.js';
import { AuditLog } from '../models/AuditLog.js';
import { logAuditEvent } from '../services/auditService.js';
import { round2 } from '../utils/calculationEngine.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });

    const totalInvoices = await Invoice.countDocuments();
    const totalIssuedInvoices = await Invoice.countDocuments({ lifecycleState: 'issued' });

    const invoiceAgg = await Invoice.aggregate([
      { $match: { lifecycleState: { $ne: 'void' } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          totalBalance: { $sum: '$balanceDue' }
        }
      }
    ]);

    const systemFinancials = invoiceAgg[0] || {
      totalAmount: 0,
      totalPaid: 0,
      totalBalance: 0
    };

    const recentLogs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          inactive: inactiveUsers
        },
        invoices: {
          total: totalInvoices,
          issued: totalIssuedInvoices,
          aggregateAmount: round2(systemFinancials.totalAmount),
          aggregatePaid: round2(systemFinancials.totalPaid),
          aggregateOutstanding: round2(systemFinancials.totalBalance)
        },
        recentActivity: recentLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const { search, status, role } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Attach invoice counts per user for admin visibility
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const invoiceCount = await Invoice.countDocuments({ ownerId: u._id });
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt,
          invoiceCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found.'
        }
      });
    }

    const invoiceCount = await Invoice.countDocuments({ ownerId: user._id });
    const aggregateInvoiced = await Invoice.aggregate([
      { $match: { ownerId: user._id, lifecycleState: { $ne: 'void' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        stats: {
          invoiceCount,
          totalInvoiced: round2(aggregateInvoiced[0]?.total || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found.'
        }
      });
    }

    // Safety guard: Prevent suspending or deactivating the last active administrator
    if (
      targetUser.role === 'admin' &&
      (status === 'suspended' || status === 'inactive')
    ) {
      const activeAdminsCount = await User.countDocuments({
        role: 'admin',
        status: 'active'
      });

      if (activeAdminsCount <= 1 && targetUser.status === 'active') {
        return res.status(400).json({
          error: {
            code: 'CANNOT_SUSPEND_LAST_ADMIN',
            message: 'Cannot suspend or deactivate the only active administrator account.'
          }
        });
      }
    }

    const previousStatus = targetUser.status;
    targetUser.status = status;
    await targetUser.save();

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'USER_STATUS_UPDATED',
      targetType: 'User',
      targetId: targetUser._id,
      reason: reason || `Changed from ${previousStatus} to ${status}`,
      ip: req.ip,
      metadata: { previousStatus, newStatus: status }
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}.`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        status: targetUser.status
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '25', 10)));
    const { action, targetType } = req.query;

    const query = {};
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
