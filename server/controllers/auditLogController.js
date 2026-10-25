    import AuditLog from "../models/AuditLog.js";

export const getAuditLogs = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.company) filter.company = req.query.company;
    if (req.query.actor) filter.actor = req.query.actor;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.entity) filter.entity = req.query.entity;

    const logs = await AuditLog.find(filter)
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate("actor", "name email role");

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};