const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  scheduledAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  meetingLink: { type: String }, // Could be generated later or stored
  isLive: { type: Boolean, default: false },
});

module.exports = mongoose.model('Meeting', meetingSchema);
