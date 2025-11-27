const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  bwSingle: { type: Number, default: 1 },       // B&W Single-side price per page
  bwDouble: { type: Number, default: 1.5 },      // B&W Double-side price per sheet
  colorSingle: { type: Number, default: 2 },    // Color single-side price per page
  colorDouble: { type: Number, default: 3 },    // Color double-side price per sheet

  maxFileSizeMB: { type: Number, default: 50 },
});

module.exports = mongoose.model("Settings", SettingsSchema);
