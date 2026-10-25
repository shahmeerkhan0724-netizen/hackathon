import Company from "../models/Company.js";

export const createCompany = async (req, res, next) => {
  try {
    const { name, email, phone, address, website, logo } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name is required.",
      });
    }

    const company = await Company.create({
      name: name.trim(),
      email,
      phone,
      address,
      website,
      logo,
    });

    res.status(201).json({
      success: true,
      message: "Company created successfully.",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find();

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "email",
      "phone",
      "address",
      "website",
      "logo",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully.",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};