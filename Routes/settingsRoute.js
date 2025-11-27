const express = require("express");
const Settings = require("../Models/Settings");

const router = express.Router();

/* GET SETTINGS */
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* SAVE SETTINGS */
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      await Settings.create(data);
    } else {
      await Settings.updateOne({}, data);
    }

    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
