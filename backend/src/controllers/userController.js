const User = require("../models/User");
const MenuItem = require("../models/MenuItem");

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const {
      name,
      password,
      phone,
      address,
      deliveryNotes,
      preferredDeliveryType,
      preferredPaymentMethod,
      favorites,
    } = req.body;

    user.name = name || user.name;
    if (typeof phone === "string") user.phone = phone.trim();

    if (address && typeof address === "object") {
      user.address = {
        street: typeof address.street === "string" ? address.street.trim() : user.address?.street || "",
        houseNumber:
          typeof address.houseNumber === "string"
            ? address.houseNumber.trim()
            : user.address?.houseNumber || "",
        postalCode:
          typeof address.postalCode === "string"
            ? address.postalCode.trim()
            : user.address?.postalCode || "",
        city: typeof address.city === "string" ? address.city.trim() : user.address?.city || "",
      };
    }

    if (typeof deliveryNotes === "string") user.deliveryNotes = deliveryNotes.trim();

    if (["delivery", "pickup"].includes(preferredDeliveryType)) {
      user.preferredDeliveryType = preferredDeliveryType;
    }

    if (["card", "paypal"].includes(preferredPaymentMethod)) {
      user.preferredPaymentMethod = preferredPaymentMethod;
    }

    if (password) user.password = password;

    if (Array.isArray(favorites)) {
      const uniqueFavoriteIds = [...new Set(favorites.filter(Boolean).map((id) => String(id)))];
      const validMenuItems = await MenuItem.find({ _id: { $in: uniqueFavoriteIds } }).select("_id");
      const validIds = validMenuItems.map((item) => item._id);
      user.favorites = validIds;
    }

    await user.save();

    await user.populate({
      path: "favorites",
      select: "name price image category description featured",
    });

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      deliveryNotes: user.deliveryNotes,
      preferredDeliveryType: user.preferredDeliveryType,
      preferredPaymentMethod: user.preferredPaymentMethod,
      favorites: user.favorites || [],
    });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate({ path: "favorites", select: "name price image category description featured" });

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const updateFavorites = async (req, res, next) => {
  try {
    const { favorites } = req.body;

    if (!Array.isArray(favorites)) {
      res.status(400);
      throw new Error("favorites must be an array");
    }

    const uniqueFavoriteIds = [...new Set(favorites.filter(Boolean).map((id) => String(id)))];
    const validMenuItems = await MenuItem.find({ _id: { $in: uniqueFavoriteIds } }).select("_id");
    const validIds = validMenuItems.map((item) => item._id);

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.favorites = validIds;
    await user.save();

    await user.populate({
      path: "favorites",
      select: "name price image category description featured",
    });

    return res.json({ favorites: user.favorites || [] });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  updateProfile,
  getMe,
  updateFavorites,
};
