const express = require("express");
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getAdminOrderSummary,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, optionalProtect, adminOnly } = require("../middleware/authMiddleware");
const { orderCreate } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post("/", optionalProtect, orderCreate, createOrder);
router.get("/", protect, getMyOrders);
router.get("/admin/summary", protect, adminOnly, getAdminOrderSummary);
router.get("/admin", protect, adminOnly, getAllOrders);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;
