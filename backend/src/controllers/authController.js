const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    const user = await User.create({ name, email, password });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      deliveryNotes: user.deliveryNotes,
      preferredDeliveryType: user.preferredDeliveryType,
      preferredPaymentMethod: user.preferredPaymentMethod,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

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
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    return next(error);
  }
};

const getProfile = async (req, res) => {
  res.json(req.user);
};

module.exports = {
  register,
  login,
  getProfile,
};
