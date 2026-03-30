const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    reservationAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 120,
      min: 30,
      max: 360,
    },
    area: {
      type: String,
      enum: ["indoor", "outdoor", "terrace"],
      default: "indoor",
    },
    specialRequests: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "cancelled", "completed"],
      default: "pending",
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

reservationSchema.index({ reservationAt: 1, status: 1 });
reservationSchema.index({ user: 1, reservationAt: -1 });

module.exports = mongoose.model("Reservation", reservationSchema);
