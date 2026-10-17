const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const Field = require("../models/Field");
const { fieldInput } = require("../services/fieldService");
const { objectId } = require("../services/partyService");
function ownerOnly(req,res,next) { if(req.user.role !== "owner") return res.status(403).json({message:"เฉพาะเจ้าของสนามเท่านั้น"}); next(); }
async function ownsField(req,res,next) { objectId(req.params.id); const field=await Field.findOne({_id:req.params.id,owner_id:req.user._id}); if(!field)return res.status(403).json({message:"คุณไม่ได้เป็นเจ้าของสนามนี้"}); next(); }
const {
  addField,
  updateField,
  deleteField,
  getFieldbyownerID,
} = require("../controllers/fieldController");

router.post("/add-fields", authenticateToken, ownerOnly, async (req, res) => {
  try {
    const fieldData = {
      ...fieldInput(req.body),
      owner_id: req.user._id,
    };

    const result = await addField(fieldData);
    if (result.success) {
      res
        .status(201)
        .json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : "Internal server error" });
  }
});

router.get("/owner-fields", authenticateToken, ownerOnly, async (req, res) => {
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

router.put("/update-fields/:id", authenticateToken, ownerOnly, ownsField, async (req, res) => {
  try {
    const fieldId = req.params.id;
    const fieldData = fieldInput(req.body, true);
    const result = await updateField(fieldId, fieldData);
    if (result.success) {
      res
        .status(200)
        .json(result.data);
    } else {
      res.status(400).json({ error: result.error.message });
    }
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : "Internal server error" });
  }
});

router.delete("/delete-fields/:id", authenticateToken, ownerOnly, ownsField, async (req, res) => {
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

module.exports = router;
