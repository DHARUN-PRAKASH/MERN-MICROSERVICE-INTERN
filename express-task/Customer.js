const mongoose = require('mongoose');

// Bank Customer Schema
var Customer = new mongoose.Schema({
  fullname: { type: String },
  username: { type: String },
  password: { type: String },
  aadhaar: { type: Number },
  pan: { type: String },
  contact: { type: Number },
  email: { type: String }
});

module.exports = mongoose.model('Customer', Customer);
