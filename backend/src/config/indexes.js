const mongoose = require("mongoose");
const logger = require("../config/logger");

/**
 * MongoDB Indexe für Performance
 * Runne nach: npm run setup:indexes
 */
const setupIndexes = async () => {
  try {
    const db = mongoose.connection;

    // User Indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    logger.info("✓ User email index created");

    // Order Indexes
    await db.collection("orders").createIndex({ createdAt: -1 });
    logger.info("✓ Order createdAt index created");

    await db.collection("orders").createIndex({ status: 1 });
    logger.info("✓ Order status index created");

    await db.collection("orders").createIndex({ userId: 1, createdAt: -1 });
    logger.info("✓ Order userId+createdAt compound index created");

    await db.collection("orders").createIndex({ deliveryType: 1 });
    logger.info("✓ Order deliveryType index created");

    // MenuItem Indexes
    await db.collection("menuitems").createIndex({ category: 1 });
    logger.info("✓ MenuItem category index created");

    await db.collection("menuitems").createIndex({
      name: "text",
      description: "text",
    });
    logger.info("✓ MenuItem text search index created");

    logger.info("🎯 All indexes created successfully");
  } catch (error) {
    logger.error("Error setting up indexes:", error);
    throw error;
  }
};

module.exports = { setupIndexes };
