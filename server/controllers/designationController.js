import Designation from "../models/Designation.js";

export const createDesignation = async (req, res, next) => {
  try {
    const {
      title,
      code,
      description,
      department,
      level,
    } = req.body;

    if (!title?.trim() || !code?.trim() || !department) {
      return res.status(400).json({
        success: false,
        message: "Title, code and department are required.",
      });
    }

    const designation = await Designation.create({
      title: title.trim(),
      code: code.trim().toUpperCase(),
      description,
      department,
      level,
    });

    res.status(201).json({
      success: true,
      data: designation,
    });
  } catch (error) {
    next(error);
  }
};

export const getDesignations = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.department) {
      filter.department = req.query.department;
    }

    const designations = await Designation.find(filter)
      .populate("department", "name code");

    res.status(200).json({
      success: true,
      count: designations.length,
      data: designations,
    });
  } catch (error) {
    next(error);
  }
};

export const getDesignation = async (req, res, next) => {
  try {
    const designation = await Designation.findById(req.params.id)
      .populate("department", "name code");

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found.",
      });
    }

    res.status(200).json({ success: true, data: designation });
  } catch (error) {
    next(error);
  }
};

export const updateDesignation = async (req, res, next) => {
  try {
    const allowed = [
      "title",
      "code",
      "description",
      "department",
      "level",
      "isActive",
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }

    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found.",
      });
    }

    res.status(200).json({ success: true, data: designation });
  } catch (error) {
    next(error);
  }
};

export const deleteDesignation = async (req, res, next) => {
  try {
    const designation = await Designation.findByIdAndDelete(
      req.params.id
    );

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Designation deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};