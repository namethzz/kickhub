const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { MongoClient } = require("mongodb");
const {
  addField,
  getAllFields,
  updateField,
  deleteField,
  getFieldbyownerID,
  getFieldbyID,
} = require("../controllers/fieldController");

const {
  addReservation,
  getAllReservations,
  updateReservation,
  getReservationbyID,
  getReservationbyFieldID,
  getReservationbyUserID,
} = require("../controllers/reservationController");

const {
  newPost,
  getPostbyJoinerID,
  deletePost,
  updatePost,
  getPostbyID,
  joinParty,
  leaveParty,
} = require("../controllers/postController");

router.get("/test", authenticateToken, (req, res) => {
  res.json({
    message: "This is private data accessible only from allowed origins.",
    data: [1, 2, 3, 4, 5],
  });
});

router.get("/user", authenticateToken, async (req, res) => {
  const client = new MongoClient("mongodb://localhost:27017");
  try {
    await client.connect();
    const db = client.db("kickhub");
    const collection = db.collection("users");
    const users = await collection.find().toArray();
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await client.close();
  }
});

router.post("/add-fields", authenticateToken, async (req, res) => {
  try {
    const fieldData = {
      ...req.body,
      owner_id: req.user._id,
    };

    const result = await addField(fieldData);
    if (result.success) {
      res
        .status(201)
        .json({ message: "Field added successfully" }, result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/fields", authenticateToken, async (req, res) => {
  try {
    const result = await getAllFields();
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/fields/:id", authenticateToken, async (req, res) => {
  try {
    const fieldId = req.params.id;
    const result = await getFieldbyID(fieldId);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/owner-fields", authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user._id;
    const result = await getFieldbyownerID(ownerId);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/update-fields/:id", authenticateToken, async (req, res) => {
  try {
    const fieldId = req.params.id;
    const fieldData = req.body;
    const result = await updateField(fieldId, fieldData);
    if (result.success) {
      res
        .status(200)
        .json({ message: "Field updated successfully" }, result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/delete-fields/:id", authenticateToken, async (req, res) => {
  try {
    const fieldId = req.params.id;
    const result = await deleteField(fieldId);
    if (result.success) {
      res.status(200).json({ message: "Field deleted successfully" });
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/new-reservation/:id", authenticateToken, async (req, res) => {
  try {
    const fieldId = req.params.id;
    const user_id = req.user._id;
    const reservationData = req.body;
    const result = await addReservation(fieldId, user_id, reservationData);
    if (result.success) {
      res
        .status(200)
        .json({ message: "Reservation added successfully" }, result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reservations", authenticateToken, async (req, res) => {
  try {
    const result = await getAllReservations();
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reservations/:id", authenticateToken, async (req, res) => {
  try {
    const reservationId = req.params.id;
    const result = await getReservationbyID(reservationId);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user-reservations", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user._id;
    const result = await getReservationbyUserID(user_id);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/field-reservations/:id", authenticateToken, async (req, res) => {
  try {
    const fieldId = req.params.id;
    const result = await getReservationbyFieldID(fieldId);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/update-reservation/:id", authenticateToken, async (req, res) => {
  try {
    const reservationId = req.params.id;
    const reservationData = req.body;
    const result = await updateReservation(reservationId, reservationData);
    if (result.success) {
      res
        .status(200)
        .json({ message: "Reservation updated successfully" }, result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/create-post/:id", authenticateToken, async (req, res) => {
  try {
    const field_id = req.params.id;
    const user_id = req.user._id;
    const postdata = req.body;
    const post = await newPost(user_id, field_id, postdata);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/posts/joiner", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user._id;
    const posts = await getPostbyJoinerID(user_id);
    res.status(200).json(posts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/post/:id", authenticateToken, async (req, res) => {
  try {
    const post_id = req.params.id;
    const post = await getPostbyID(post_id);
    res.status(200).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/delete-post/:id", authenticateToken, async (req, res) => {
  try {
    const post_id = req.params.id;
    const result = await deletePost(post_id);
    if (result.success) {
      res.status(200).json({ message: "Post deleted successfully" });
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/update-post/:id", authenticateToken, async (req, res) => {
  try {
    const post_id = req.params.id;
    const postdata = req.body;
    const result = await updatePost(post_id, postdata);
    if (result.success) {
      res
        .status(200)
        .json({ message: "Post updated successfully" }, result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/join-party/:id", authenticateToken, async (req, res) => {
  try {
    const post_id = req.params.id;
    const user_id = req.user._id;
    const { position } = req.body;
    const result = await joinParty(post_id, user_id, position);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/leave-party/:id", authenticateToken, async (req, res) => {
  try {
    const post_id = req.params.id;
    const user_id = req.user._id;
    const result = await leaveParty(post_id, user_id);
    if (result.success) {
      res.status(200).json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
