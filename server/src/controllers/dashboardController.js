import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { round2 } from '../utils/calculationEngine.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user._id);

    // Summary query
    const stats = await Invoice.aggregate([
      { $match: { ownerId } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          // Exclude void invoices from invoiced amounts
          totalInvoicedAmount: {
            $sum: {
              $cond: [{ $eq: ['$lifecycleState', 'void'] }, 0, '$grandTotal']
            }
          },
          totalAmountPaid: {
            $sum: {
              $cond: [{ $eq: ['$lifecycleState', 'void'] }, 0, '$amountPaid']
            }
          },
          outstandingBalance: {
            $sum: {
              $cond: [{ $eq: ['$lifecycleState', 'void'] }, 0, '$balanceDue']
            }
          },
          overdueCount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'overdue'] }, 1, 0]
            }
          },
          draftCount: {
            $sum: {
              $cond: [{ $eq: ['$lifecycleState', 'draft'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalInvoices: 0,
      totalInvoicedAmount: 0,
      totalAmountPaid: 0,
      outstandingBalance: 0,
      overdueCount: 0,
      draftCount: 0
    };

    res.status(200).json({
      success: true,
      data: {
        totalInvoices: result.totalInvoices,
        totalInvoicedAmount: round2(result.totalInvoicedAmount),
        totalAmountPaid: round2(result.totalAmountPaid),
        outstandingBalance: round2(result.outstandingBalance),
        overdueCount: result.overdueCount,
        draftCount: result.draftCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyStats = async (req, res, next) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user._id);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAggregation = await Invoice.aggregate([
      {
        $match: {
          ownerId,
          lifecycleState: { $ne: 'void' },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          invoiced: { $sum: '$grandTotal' },
          paid: { $sum: '$amountPaid' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Build standard 6 months array
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeline = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const label = `${monthNames[m - 1]} ${y}`;

      const found = monthlyAggregation.find(
        (item) => item._id.year === y && item._id.month === m
      );

      timeline.push({
        name: label,
        invoiced: round2(found ? found.invoiced : 0),
        paid: round2(found ? found.paid : 0)
      });
    }

    res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceStatusDistribution = async (req, res, next) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user._id);

    const distribution = await Invoice.aggregate([
      { $match: { ownerId } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          amount: { $sum: '$grandTotal' }
        }
      }
    ]);

    const statuses = ['paid', 'unpaid', 'partially_paid', 'overdue', 'draft', 'void'];
    const formatted = statuses.map((statusKey) => {
      const match = distribution.find((d) => d._id === statusKey);
      return {
        status: statusKey,
        count: match ? match.count : 0,
        amount: round2(match ? match.amount : 0)
      };
    });

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};
