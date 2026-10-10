const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const { MongoClient } = require("mongodb");

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  const client = new MongoClient("mongodb://localhost:27017");
  try {
    await client.connect();
    const db = client.db("kickhub");
    const collection = db.collection("users");
    const user = await collection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: "24h" });
    res.status(200).json({ status: "ok", message: "Login successful", token });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await client.close();
  }
});

module.exports = router;
