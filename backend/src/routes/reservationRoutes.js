const express = require("express");
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
  cancelMyReservation,
} = require("../controllers/reservationController");
const { protect, optionalProtect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", optionalProtect, createReservation);
router.get("/mine", protect, getMyReservations);
router.put("/:id/cancel", protect, cancelMyReservation);
router.get("/admin", protect, adminOnly, getAllReservations);
router.put("/:id/status", protect, adminOnly, updateReservationStatus);

module.exports = router;
