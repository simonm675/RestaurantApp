const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const User = require("../models/User");

const ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready-for-pickup",
  "out-for-delivery",
  "completed",
  "cancelled",
];
const PRIORITIES = ["low", "normal", "high", "urgent"];

const allowedTransitions = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready-for-pickup", "completed", "cancelled"],
  "ready-for-pickup": ["out-for-delivery", "completed", "cancelled"],
  "out-for-delivery": ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const ACTIVE_STATUS_FOR_ALERTS = [
  "pending",
  "preparing",
  "ready-for-pickup",
  "out-for-delivery",
];

const toMoney = (value) => Number(Number(value).toFixed(2));

const buildOrderNumber = () => {
  const stamp = Date.now().toString().slice(-8);
  const randomPart = Math.floor(Math.random() * 900 + 100);
  return `RA-${stamp}-${randomPart}`;
};

const estimatePrepMinutes = (itemsCount, deliveryType) => {
  const base = deliveryType === "pickup" ? 12 : 16;
  const perItem = 3;
  const travelBuffer = deliveryType === "delivery" ? 8 : 0;
  const estimated = base + itemsCount * perItem + travelBuffer;
  return Math.max(10, Math.min(90, estimated));
};

const getGuestUserId = async () => {
  const guestEmail = "guest.checkout@restaurant.local";
  let guest = await User.findOne({ email: guestEmail }).select("_id");

  if (!guest) {
    guest = await User.create({
      name: "Gastbestellung",
      email: guestEmail,
      password: Math.random().toString(36).slice(2) + "Aa1!",
      role: "user",
    });
  }

  return guest._id;
};

const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      address,
      deliveryType,
      paymentMethod,
      customerPhone,
      deliveryNotes,
      guestName,
      guestEmail,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("Order must include at least one item");
    }

    if (!["delivery", "pickup"].includes(deliveryType)) {
      res.status(400);
      throw new Error("Invalid delivery type");
    }

    if (!["card", "paypal"].includes(paymentMethod)) {
      res.status(400);
      throw new Error("Invalid payment method");
    }

    if (deliveryType === "delivery" && !address?.trim()) {
      res.status(400);
      throw new Error("Delivery address is required");
    }

    const normalizedPayloadItems = items.map((item) => {
      const menuItemId = item?.menuItem;
      const quantity = Number(item?.quantity || 0);

      if (!menuItemId || quantity < 1) {
        res.status(400);
        throw new Error("Invalid order item payload");
      }

      const selectedOptions = Array.isArray(item.selectedOptions)
        ? item.selectedOptions
            .filter((option) => option && option.label)
            .map((option) => ({
              label: String(option.label).trim(),
              value: String(option.value || "").trim(),
              price: Math.max(0, Number(option.price || 0)),
            }))
        : [];

      return {
        menuItemId: String(menuItemId),
        quantity,
        selectedOptions,
        specialInstructions: String(item.specialInstructions || "").trim(),
      };
    });

    const uniqueMenuItemIds = [...new Set(normalizedPayloadItems.map((item) => item.menuItemId))];
    const menuItems = await MenuItem.find({ _id: { $in: uniqueMenuItemIds } });
    if (menuItems.length !== uniqueMenuItemIds.length) {
      res.status(400);
      throw new Error("Some menu items no longer exist");
    }

    const menuItemById = new Map(menuItems.map((menuItem) => [String(menuItem._id), menuItem]));

    const normalizedItems = normalizedPayloadItems.map((payloadItem) => {
      const menuItem = menuItemById.get(payloadItem.menuItemId);
      if (!menuItem) {
        res.status(400);
        throw new Error("Some menu items no longer exist");
      }

      const optionSurcharge = payloadItem.selectedOptions.reduce(
        (acc, option) => acc + Number(option.price || 0),
        0
      );
      const price = toMoney(Number(menuItem.price) + optionSurcharge);

      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price,
        quantity: payloadItem.quantity,
        image: menuItem.image,
        selectedOptions: payloadItem.selectedOptions,
        specialInstructions: payloadItem.specialInstructions,
      };
    });

    const subtotal = toMoney(
      normalizedItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    );
    const deliveryFee = deliveryType === "delivery" ? 2.9 : 0;
    const totalPrice = toMoney(subtotal + deliveryFee);
    const itemCount = normalizedItems.reduce((acc, item) => acc + item.quantity, 0);
    const estimatedMinutes = estimatePrepMinutes(itemCount, deliveryType);
    const estimatedReadyAt = new Date(Date.now() + estimatedMinutes * 60000);

    const isGuestCheckout = !req.user?._id;
    const userId = req.user?._id || (await getGuestUserId());

    const normalizedGuestName = String(guestName || "").trim();
    const normalizedGuestEmail = String(guestEmail || "").trim().toLowerCase();
    const normalizedCustomerPhone = customerPhone?.trim() || "";

    if (isGuestCheckout) {
      if (normalizedGuestName.length < 2) {
        res.status(400);
        throw new Error("Guest name is required");
      }

      const hasContactPhone = normalizedCustomerPhone.length > 0;
      const hasContactMail = /.+@.+\..+/.test(normalizedGuestEmail);
      if (!hasContactPhone && !hasContactMail) {
        res.status(400);
        throw new Error("Guest checkout requires phone or valid email");
      }
    }

    const order = await Order.create({
      orderNumber: buildOrderNumber(),
      userId,
      items: normalizedItems,
      subtotal,
      deliveryFee,
      totalPrice,
      address: deliveryType === "pickup" ? "Abholung vor Ort" : address.trim(),
      deliveryType,
      paymentMethod,
      customerPhone: normalizedCustomerPhone,
      guestName: isGuestCheckout ? normalizedGuestName : "",
      guestEmail: isGuestCheckout ? normalizedGuestEmail : "",
      deliveryNotes: deliveryNotes?.trim() || "",
      estimatedPrepMinutes: estimatedMinutes,
      estimatedReadyAt,
      statusHistory: [{ status: "pending", note: "Order created" }],
    });

    const socketManager = req.app.get("socketManager");
    if (socketManager) {
      socketManager.notifyKitchenNewOrder(order);
    }

    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
};

const getOrderForTracking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (req.user) {
      const isAdmin = req.user.role === "admin";
      const isOwner = String(order.userId) === String(req.user._id);

      if (!isAdmin && !isOwner) {
        res.status(403);
        throw new Error("Not authorized to access this order");
      }
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { status, deliveryType, priority, search, lateOnly } = req.query;
    const query = {};

    if (status && ORDER_STATUSES.includes(status)) {
      query.status = status;
    }

    if (deliveryType && ["delivery", "pickup"].includes(deliveryType)) {
      query.deliveryType = deliveryType;
    }

    if (priority && PRIORITIES.includes(priority)) {
      query.priority = priority;
    }

    if (lateOnly === "true") {
      query.status = { $in: ACTIVE_STATUS_FOR_ALERTS };
      query.estimatedReadyAt = { $lt: new Date() };
    }

    if (search?.trim()) {
      const expr = new RegExp(search.trim(), "i");
      query.$or = [
        { orderNumber: expr },
        { address: expr },
        { assignedCourier: expr },
      ];
    }

    const orders = await Order.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, estimatedPrepMinutes, assignedCourier, priority, adminNote } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    let statusChanged = false;

    if (status && status !== order.status) {
      if (!ORDER_STATUSES.includes(status)) {
        res.status(400);
        throw new Error("Invalid status");
      }

      const possible = allowedTransitions[order.status] || [];
      if (!possible.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status transition: ${order.status} -> ${status}`);
      }

      if (status === "out-for-delivery" && order.deliveryType !== "delivery") {
        res.status(400);
        throw new Error("Only delivery orders can be marked as out-for-delivery");
      }

      order.status = status;
      statusChanged = true;
      order.statusHistory.push({
        status,
        note: adminNote?.trim() || `Status changed to ${status}`,
      });
    }

    if (priority) {
      if (!PRIORITIES.includes(priority)) {
        res.status(400);
        throw new Error("Invalid priority");
      }
      order.priority = priority;
    }

    if (assignedCourier !== undefined) {
      order.assignedCourier = String(assignedCourier || "").trim();
    }

    if (estimatedPrepMinutes !== undefined) {
      const minutes = Number(estimatedPrepMinutes);
      if (!Number.isFinite(minutes) || minutes < 5 || minutes > 180) {
        res.status(400);
        throw new Error("estimatedPrepMinutes must be between 5 and 180");
      }
      order.estimatedPrepMinutes = Math.round(minutes);
      order.estimatedReadyAt = new Date(Date.now() + order.estimatedPrepMinutes * 60000);
    }

    await order.save();

    if (statusChanged) {
      const socketManager = req.app.get("socketManager");
      if (socketManager) {
        socketManager.broadcastOrderStatusUpdate(String(order._id), order.status, {
          updatedAt: order.updatedAt,
        });
      }
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

const getAdminOrderSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pending,
      preparing,
      readyForPickup,
      outForDelivery,
      completed,
      cancelled,
      lateOrders,
      deliveryCount,
      pickupCount,
      revenueToday,
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "preparing" }),
      Order.countDocuments({ status: "ready-for-pickup" }),
      Order.countDocuments({ status: "out-for-delivery" }),
      Order.countDocuments({ status: "completed" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.countDocuments({
        status: { $in: ACTIVE_STATUS_FOR_ALERTS },
        estimatedReadyAt: { $lt: now },
      }),
      Order.countDocuments({ deliveryType: "delivery" }),
      Order.countDocuments({ deliveryType: "pickup" }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: todayStart },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, sum: { $sum: "$totalPrice" } } },
      ]),
    ]);

    return res.json({
      totalOrders,
      statuses: {
        pending,
        preparing,
        readyForPickup,
        outForDelivery,
        completed,
        cancelled,
      },
      lateOrders,
      deliveryCount,
      pickupCount,
      revenueToday: toMoney(revenueToday[0]?.sum || 0),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderForTracking,
  getAllOrders,
  getAdminOrderSummary,
  updateOrderStatus,
};
