const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const port = 3000;

const app = express();

require("./database"); // Import the database connection
require("dotenv").config();
const apiPrivateRoutes = require("./routes/apiPrivateRoutes");
const apiRegisterRoutes = require("./routes/apiRegister");
const apiAuthRoutes = require("./routes/apiAuthRoutes");

const allowedDomains = [
  "http://localhost:5500",
  "http://localhost:5501",
  "http://localhost:5502",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(new Error(`Origin not allowed by CORS`), false);
    }
    if (allowedDomains.includes(origin)) {
      return callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  methods: [`GET`, `POST`],
  credentials: true,
  allowedHeaders: [`Content-Type`, `Authorization`],
};

// app.use(cors(corsOptions));
// app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

app.use((err, req, res, next) => {
  if (err.message === "Origin not allowed by CORS") {
    res.status(403).json({
      error: `Access denied by CORS policy does not allow access from your origin.`,
    });
  } else {
    next(err);
  }
});

app.use("/api", apiPrivateRoutes);
app.use("/register", apiRegisterRoutes);
app.use("/login", apiAuthRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
