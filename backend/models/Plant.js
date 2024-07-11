const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  views: { type: Number, default: 0 }
});

const Plant = mongoose.model('Plant', plantSchema);

module.exports = Plant;