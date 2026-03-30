const mongoose = require("mongoose");

const orderOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      required: true,
    },
    selectedOptions: {
      type: [orderOptionSchema],
      default: [],
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready-for-pickup", "out-for-delivery", "completed", "cancelled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    estimatedPrepMinutes: {
      type: Number,
      min: 5,
      max: 180,
      default: 25,
    },
    estimatedReadyAt: {
      type: Date,
    },
    assignedCourier: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    guestName: {
      type: String,
      trim: true,
      default: "",
    },
    guestEmail: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryNotes: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryType: {
      type: String,
      enum: ["delivery", "pickup"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "paypal"],
      required: true,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "preparing", "ready-for-pickup", "out-for-delivery", "completed", "cancelled"],
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
