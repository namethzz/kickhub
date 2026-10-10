const express = require("express");
const router = express.Router();
const Users = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

// Register a new user in the database
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new Users({ name, email, password: hashedPassword, role });
    const savedUser = await user.save();
    if (savedUser) {
      const token = jwt.sign({ id: savedUser.id }, SECRET_KEY, {
        expiresIn: "1h",
      });
      res
        .status(200)
        .json({ status: "ok", message: "User registered successfully", token });
    } else {
      console.error("Error inserting user:", error);
      return res.status(500).json({ message: "Error registering user" });
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});
module.exports = router;
