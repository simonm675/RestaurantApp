require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const MenuItem = require("../models/MenuItem");

const IMAGE_UPDATES = {
  Capricciosa: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=900&h=900&fit=crop&auto=format",
  "Tagliatelle Carbonara": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=900&h=900&fit=crop&auto=format",
};

const run = async () => {
  await connectDB();

  const names = Object.keys(IMAGE_UPDATES);
  let updatedCount = 0;

  for (const name of names) {
    const image = IMAGE_UPDATES[name];
    const result = await MenuItem.updateMany({ name }, { $set: { image } });
    updatedCount += Number(result.modifiedCount || 0);
    console.log(`${name}: matched=${result.matchedCount}, updated=${result.modifiedCount}`);
  }

  console.log(`Image backfill completed. Updated records: ${updatedCount}`);
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("fix-menu-images failed:", error.message);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  process.exit(1);
});
