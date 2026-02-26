const mongoose = require('mongoose');

const AiLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    endpoint: { type: String, required: true },
    provider: { type: String },
    model: { type: String },
    promptLength: { type: Number },
    responseLength: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiLog', AiLogSchema);

