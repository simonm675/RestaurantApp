require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const run = async () => {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "Please set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD environment variables"
    );
  }

  if (password.length < 6) {
    throw new Error("ADMIN_PASSWORD must be at least 6 characters long");
  }

  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (!existingUser) {
    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "admin",
    });

    console.log(`Admin created: ${admin.email}`);
  } else {
    existingUser.name = name.trim();
    existingUser.password = password;
    existingUser.role = "admin";
    await existingUser.save();

    console.log(`Admin updated: ${existingUser.email}`);
  }

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("create-admin failed:", error.message);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  process.exit(1);
});
