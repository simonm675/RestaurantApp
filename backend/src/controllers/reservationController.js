const Reservation = require("../models/Reservation");

const parseReservationAt = (date, time) => {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const createReservation = async (req, res, next) => {
  try {
    const {
      date,
      time,
      partySize,
      area,
      specialRequests,
      durationMinutes,
      name: providedName,
      phone: providedPhone,
      email: providedEmail,
    } = req.body;

    const reservationAt = parseReservationAt(date, time);
    if (!reservationAt) {
      res.status(400);
      throw new Error("Bitte gültiges Datum und Uhrzeit angeben");
    }

    if (reservationAt.getTime() < Date.now() + 30 * 60 * 1000) {
      res.status(400);
      throw new Error("Reservierungen müssen mindestens 30 Minuten in der Zukunft liegen");
    }

    const guests = Number(partySize);
    if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
      res.status(400);
      throw new Error("Personenzahl muss zwischen 1 und 20 liegen");
    }

    const name = String(providedName || req.user?.name || "").trim();
    const phone = String(providedPhone || req.user?.phone || "").trim();
    const email = String(providedEmail || req.user?.email || "").trim().toLowerCase();

    if (!name) {
      res.status(400);
      throw new Error("Name ist erforderlich");
    }

    if (!phone && !email) {
      res.status(400);
      throw new Error("Bitte Telefonnummer oder E-Mail angeben");
    }

    const reservation = await Reservation.create({
      user: req.user?._id || null,
      name,
      phone,
      email,
      partySize: guests,
      reservationAt,
      area: ["indoor", "outdoor", "terrace"].includes(area) ? area : "indoor",
      specialRequests: typeof specialRequests === "string" ? specialRequests.trim() : "",
      durationMinutes: Number.isFinite(Number(durationMinutes)) ? Number(durationMinutes) : 120,
      status: "pending",
    });

    return res.status(201).json(reservation);
  } catch (error) {
    return next(error);
  }
};

const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id }).sort({ reservationAt: -1 });
    return res.json(reservations);
  } catch (error) {
    return next(error);
  }
};

const getAllReservations = async (req, res, next) => {
  try {
    const { status, from, to } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;

    if (from || to) {
      filter.reservationAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    }

    const reservations = await Reservation.find(filter)
      .populate("user", "name email")
      .sort({ reservationAt: 1, createdAt: -1 });

    return res.json(reservations);
  } catch (error) {
    return next(error);
  }
};

const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      res.status(404);
      throw new Error("Reservierung nicht gefunden");
    }

    if (status && ["pending", "confirmed", "declined", "cancelled", "completed"].includes(status)) {
      reservation.status = status;
    }

    if (typeof adminNote === "string") {
      reservation.adminNote = adminNote.trim();
    }

    await reservation.save();
    return res.json(reservation);
  } catch (error) {
    return next(error);
  }
};

const cancelMyReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      res.status(404);
      throw new Error("Reservierung nicht gefunden");
    }

    if (!reservation.user || String(reservation.user) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Keine Berechtigung für diese Reservierung");
    }

    if (["completed", "declined"].includes(reservation.status)) {
      res.status(400);
      throw new Error("Diese Reservierung kann nicht mehr storniert werden");
    }

    reservation.status = "cancelled";
    await reservation.save();

    return res.json(reservation);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  updateReservationStatus,
  cancelMyReservation,
};
