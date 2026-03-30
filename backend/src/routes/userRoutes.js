const express = require("express");
const { getUsers, updateProfile, getMe, updateFavorites } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/favorites", protect, updateFavorites);

module.exports = router;
