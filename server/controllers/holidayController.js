import Holiday from "../models/Holiday.js";

export const createHoliday = async (req, res, next) => {
  try {
    const { company, name, date, description, type } = req.body;

    if (!company || !name?.trim() || !date) {
      return res.status(400).json({
        success: false,
        message: "Company, name and date are required.",
      });
    }

    const holiday = await Holiday.create({
      company,
      name: name.trim(),
      date,
      description,
      type,
    });

    res.status(201).json({
      success: true,
      message: "Holiday created successfully.",
      data: holiday,
    });
  } catch (error) {
    next(error);
  }
};

export const getHolidays = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.company) filter.company = req.query.company;
    if (req.query.year) {
      filter.date = {
        $gte: `${req.query.year}-01-01`,
        $lte: `${req.query.year}-12-31`,
      };
    }

    const holidays = await Holiday.find(filter).sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays,
    });
  } catch (error) {
    next(error);
  }
};

export const getHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found.",
      });
    }

    res.status(200).json({ success: true, data: holiday });
  } catch (error) {
    next(error);
  }
};

export const updateHoliday = async (req, res, next) => {
  try {
    const allowed = ["name", "date", "description", "type", "isActive"];
    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found.",
      });
    }

    res.status(200).json({ success: true, data: holiday });
  } catch (error) {
    next(error);
  }
};

export const deleteHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holiday deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};