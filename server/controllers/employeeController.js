import Employee from "../models/Employee.js";

export const createEmployee = async (req, res, next) => {
  try {
    const {
      employeeId,
      user,
      company,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      department,
      designation,
      manager,
      joiningDate,
      employmentType,
      employmentStatus,
      basicSalary,
      emergencyContact,
    } = req.body;

    if (
      !employeeId ||
      !company ||
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !department ||
      !designation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee ID, company, first name, last name, email, department and designation are required.",
      });
    }

    const employee = await Employee.create({
      employeeId,
      user,
      company,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone,
      dateOfBirth,
      gender,
      address,
      department,
      designation,
      manager,
      joiningDate,
      employmentType,
      employmentStatus,
      basicSalary,
      emergencyContact,
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.company) filter.company = req.query.company;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.designation) filter.designation = req.query.designation;
    if (req.query.employmentStatus) {
      filter.employmentStatus = req.query.employmentStatus;
    }

    const employees = await Employee.find(filter)
      .select("-bankAccount")
      .populate("department", "name code")
      .populate("designation", "title code")
      .populate("manager", "firstName lastName");

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("-bankAccount")
      .populate("department", "name code")
      .populate("designation", "title code")
      .populate("manager", "firstName lastName");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const allowed = [
      "firstName",
      "lastName",
      "phone",
      "dateOfBirth",
      "gender",
      "address",
      "department",
      "designation",
      "manager",
      "joiningDate",
      "employmentType",
      "employmentStatus",
      "basicSalary",
      "emergencyContact",
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-bankAccount");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};