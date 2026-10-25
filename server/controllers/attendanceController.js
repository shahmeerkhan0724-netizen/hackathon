import Attendance from "../models/Attendance.js";

const getToday = () => new Date().toISOString().slice(0, 10);

export const checkIn = async (req, res, next) => {
  try {
    const { employee, company } = req.body;

    if (!employee || !company) {
      return res.status(400).json({
        success: false,
        message: "Employee and company are required.",
      });
    }

    const date = getToday();
    const existing = await Attendance.findOne({ employee, date });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for today.",
      });
    }

    const attendance = await Attendance.create({
      employee,
      company,
      date,
      checkIn: new Date(),
      status: "Present",
      markedBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Check-in successful.",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const { employee } = req.body;

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Employee is required.",
      });
    }

    const attendance = await Attendance.findOne({
      employee,
      date: getToday(),
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(404).json({
        success: false,
        message: "Today's check-in record was not found.",
      });
    }

    if (attendance.checkOut) {
      return res.status(409).json({
        success: false,
        message: "You have already checked out.",
      });
    }

    const now = new Date();
    const minutes = Math.max(
      0,
      Math.floor((now - new Date(attendance.checkIn)) / 60000)
    );

    attendance.checkOut = now;
    attendance.totalMinutes = minutes;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Check-out successful.",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const markAttendance = async (req, res, next) => {
  try {
    const { employee, company, date, status, notes } = req.body;

    if (!employee || !company || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "Employee, company, date and status are required.",
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { employee, date },
      { employee, company, date, status, notes, markedBy: req.user?._id },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Attendance saved successfully.",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceRecords = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.company) filter.company = req.query.company;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.status) filter.status = req.query.status;

    const records = await Attendance.find(filter)
      .populate("employee", "firstName lastName employeeId")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id)
      .populate("employee", "firstName lastName employeeId");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (req, res, next) => {
  try {
    const allowed = [
      "date",
      "checkIn",
      "checkOut",
      "status",
      "totalMinutes",
      "notes",
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};