import Payroll from "../models/Payroll.js";

export const generatePayroll = async (req, res, next) => {
  try {
    const {
      employee,
      company,
      month,
      year,
      basicSalary,
      allowances = 0,
      overtimeAmount = 0,
      bonus = 0,
      deductions = 0,
      tax = 0,
    } = req.body;

    if (
      !employee ||
      !company ||
      !month ||
      !year ||
      basicSalary === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Employee, company, month, year and basic salary are required.",
      });
    }

    const amounts = [
      basicSalary,
      allowances,
      overtimeAmount,
      bonus,
      deductions,
      tax,
    ];

    if (
      amounts.some(
        (value) =>
          !Number.isFinite(Number(value)) || Number(value) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Salary amounts must be valid non-negative numbers.",
      });
    }

    const grossSalary =
      Number(basicSalary) +
      Number(allowances) +
      Number(overtimeAmount) +
      Number(bonus);

    const netSalary =
      grossSalary - Number(deductions) - Number(tax);

    if (netSalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Deductions and tax cannot exceed gross salary.",
      });
    }

    const payroll = await Payroll.create({
      employee,
      company,
      month,
      year,
      basicSalary,
      allowances,
      overtimeAmount,
      bonus,
      deductions,
      tax,
      grossSalary,
      netSalary,
      generatedBy: req.user?._id,
      status: "Draft",
    });

    res.status(201).json({
      success: true,
      message: "Payroll record generated.",
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollRecords = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.company) filter.company = req.query.company;
    if (req.query.month) filter.month = req.query.month;
    if (req.query.year) filter.year = Number(req.query.year);
    if (req.query.status) filter.status = req.query.status;

    const records = await Payroll.find(filter)
      .populate("employee", "firstName lastName employeeId")
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("employee", "firstName lastName employeeId");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found.",
      });
    }

    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};

export const approvePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found.",
      });
    }

    if (payroll.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft payroll can be approved.",
      });
    }

    payroll.status = "Approved";
    await payroll.save();

    res.status(200).json({
      success: true,
      message: "Payroll approved.",
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const markPayrollPaid = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found.",
      });
    }

    if (payroll.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved payroll can be marked as paid.",
      });
    }

    payroll.status = "Paid";
    payroll.paymentDate = new Date();

    if (req.body.paymentReference) {
      payroll.paymentReference = req.body.paymentReference;
    }

    await payroll.save();

    res.status(200).json({
      success: true,
      message: "Payroll marked as paid.",
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};