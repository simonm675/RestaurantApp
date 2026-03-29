const MenuItem = require("../models/MenuItem");

const DEFAULT_MENU_IMAGES = {
  pizza: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=900&h=900&fit=crop&auto=format",
  pasta: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=900&h=900&fit=crop&auto=format",
  salat: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&h=900&fit=crop&auto=format",
  panini: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&h=900&fit=crop&auto=format",
  dessert: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=900&h=900&fit=crop&auto=format",
  getraenke: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=900&h=900&fit=crop&auto=format",
  default: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&h=900&fit=crop&auto=format",
};

const getDefaultImageByCategory = (category = "") => {
  const normalized = String(category).trim().toLowerCase();
  return DEFAULT_MENU_IMAGES[normalized] || DEFAULT_MENU_IMAGES.default;
};

const normalizeMenuPayload = (payload = {}) => {
  const image = typeof payload.image === "string" ? payload.image.trim() : "";
  return {
    ...payload,
    image: image || getDefaultImageByCategory(payload.category),
  };
};

const getMenuItems = async (req, res, next) => {
  try {
    const { category, search, featured } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (featured === "true") filter.featured = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const items = await MenuItem.find(filter).sort({ createdAt: -1 });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.create(normalizeMenuPayload(req.body));
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, normalizeMenuPayload(req.body), {
      new: true,
      runValidators: true,
    });

    if (!item) {
      res.status(404);
      throw new Error("Menu item not found");
    }

    return res.json(item);
  } catch (error) {
    return next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error("Menu item not found");
    }

    return res.json({ message: "Menu item deleted" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
