import LeaveRequest from "../models/LeaveRequest.js";

export const createLeaveRequest = async (req, res, next) => {
  try {
    const {
      employee,
      company,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
    } = req.body;

    if (
      !employee ||
      !company ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !reason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required leave details.",
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    const leave = await LeaveRequest.create({
      employee,
      company,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Leave request submitted.",
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequests = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.company) filter.company = req.query.company;
    if (req.query.status) filter.status = req.query.status;

    const leaves = await LeaveRequest.find(filter)
      .populate("employee", "firstName lastName employeeId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequest = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id)
      .populate("employee", "firstName lastName employeeId");

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
};

export const approveLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be approved.",
      });
    }

    leave.status = "Approved";
    leave.reviewedBy = req.user?._id;
    leave.reviewedAt = new Date();
    leave.reviewComment = req.body.comment || "";

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave approved.",
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be rejected.",
      });
    }

    leave.status = "Rejected";
    leave.reviewedBy = req.user?._id;
    leave.reviewedAt = new Date();
    leave.reviewComment = req.body.comment || "";

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave rejected.",
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    if (!["Pending", "Approved"].includes(leave.status)) {
      return res.status(400).json({
        success: false,
        message: "This leave request cannot be cancelled.",
      });
    }

    leave.status = "Cancelled";
    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave request cancelled.",
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};