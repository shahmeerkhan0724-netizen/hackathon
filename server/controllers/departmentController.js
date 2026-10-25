import Department from "../models/Department.js";

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, company, head } = req.body;

    if (!name?.trim() || !code?.trim() || !company) {
      return res.status(400).json({
        success: false,
        message: "Name, code and company are required.",
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description,
      company,
      head,
    });

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.company) {
      filter.company = req.query.company;
    }

    const departments = await Department.find(filter)
      .populate("company", "name")
      .populate("head", "firstName lastName");

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("company", "name")
      .populate("head", "firstName lastName");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const allowed = ["name", "code", "description", "head", "isActive"];
    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};