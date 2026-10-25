    import LeaveBalance from "../models/LeaveBalance.js";

export const createLeaveBalance = async (req, res, next) => {
  try {
    const { employee, company, year } = req.body;

    if (!employee || !company || !year) {
      return res.status(400).json({
        success: false,
        message: "Employee, company and year are required.",
      });
    }

    const balance = await LeaveBalance.create({
      employee,
      company,
      year,
    });

    res.status(201).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveBalances = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.company) filter.company = req.query.company;
    if (req.query.year) filter.year = Number(req.query.year);
    if (req.query.employee) filter.employee = req.query.employee;

    const balances = await LeaveBalance.find(filter)
      .populate("employee", "firstName lastName employeeId");

    res.status(200).json({
      success: true,
      count: balances.length,
      data: balances,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeLeaveBalance = async (req, res, next) => {
  try {
    const filter = { employee: req.params.employeeId };

    if (req.query.year) {
      filter.year = Number(req.query.year);
    } else {
      filter.year = new Date().getFullYear();
    }

    const balance = await LeaveBalance.findOne(filter);

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: "Leave balance not found.",
      });
    }

    res.status(200).json({ success: true, data: balance });
  } catch (error) {
    next(error);
  }
};

export const updateLeaveBalance = async (req, res, next) => {
  try {
    const allowed = ["annual", "sick", "casual", "unpaid"];
    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const balance = await LeaveBalance.findOneAndUpdate(
      {
        employee: req.params.employeeId,
        year: req.body.year || new Date().getFullYear(),
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: "Leave balance not found.",
      });
    }

    res.status(200).json({ success: true, data: balance });
  } catch (error) {
    next(error);
  }
};