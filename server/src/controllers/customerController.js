import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';

export const getCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const search = (req.query.search || '').trim();

    const query = { ownerId: req.user._id, isArchived: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: customers,
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

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!customer) {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found or unauthorized.'
        }
      });
    }

    // Also get customer stats (invoices count, total invoiced)
    const invoiceCount = await Invoice.countDocuments({
      ownerId: req.user._id,
      customerId: customer._id
    });

    res.status(200).json({
      success: true,
      data: customer,
      stats: {
        invoiceCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      ownerId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found or unauthorized.'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!customer) {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found or unauthorized.'
        }
      });
    }

    // Check if customer is referenced in any invoices
    const hasInvoices = await Invoice.exists({
      ownerId: req.user._id,
      customerId: customer._id
    });

    if (hasInvoices) {
      // Archive customer to preserve historical invoice records
      customer.isArchived = true;
      await customer.save();

      return res.status(200).json({
        success: true,
        message: 'Customer has associated invoices and was archived to preserve billing history.'
      });
    }

    await Customer.deleteOne({ _id: customer._id });

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
