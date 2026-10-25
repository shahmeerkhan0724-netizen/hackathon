import Announcement from "../models/Announcement.js";

export const createAnnouncement = async (req, res, next) => {
  try {
    const {
      company,
      title,
      message,
      category,
      audience,
      publishAt,
      expiresAt,
      isPublished,
    } = req.body;

    if (!company || !title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company, title and message are required.",
      });
    }

    const announcement = await Announcement.create({
      company,
      title: title.trim(),
      message: message.trim(),
      category,
      audience,
      publishAt,
      expiresAt,
      isPublished,
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.company) filter.company = req.query.company;
    if (req.query.category) filter.category = req.query.category;

    // Published announcements only
    if (req.query.includeUnpublished !== "true") {
      filter.isPublished = true;
      filter.$and = [
        {
          $or: [
            { publishAt: { $exists: false } },
            { publishAt: null },
            { publishAt: { $lte: new Date() } },
          ],
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
          ],
        },
      ];
    }

    const announcements = await Announcement.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const allowed = [
      "title",
      "message",
      "category",
      "audience",
      "publishAt",
      "expiresAt",
      "isPublished",
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(
      req.params.id
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};