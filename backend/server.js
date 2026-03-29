require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const connectDB = require("./src/config/db");
const logger = require("./src/config/logger");
const SocketManager = require("./src/socket/SocketManager");
const { globalLimiter, authLimiter } = require("./src/middleware/rateLimitMiddleware");

const authRoutes = require("./src/routes/authRoutes");
const menuRoutes = require("./src/routes/menuRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const userRoutes = require("./src/routes/userRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Socket Manager initialisieren
const socketManager = new SocketManager(io);
app.set("socketManager", socketManager);

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Custom Morgan Logging (über Winston)
const morgan = require("morgan");
app.use(morgan("combined", { stream: logger.httpStream }));

// Rate Limiting
app.use(globalLimiter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Server starten
httpServer.listen(PORT, () => {
  logger.info(`🍽️  Restaurant API running on port ${PORT}`);
  logger.info(`WebSocket aktiv (Socket.IO)`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM empfangen, fahre Server herunter...");
  httpServer.close(() => {
    logger.info("HTTP Server beendet");
    process.exit(0);
  });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason, promise });
  process.exit(1);
});

module.exports = { app, io, socketManager };

