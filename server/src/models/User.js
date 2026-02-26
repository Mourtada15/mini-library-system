const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ['ADMIN', 'LIBRARIAN', 'MEMBER'],
      default: 'MEMBER',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('User', UserSchema);

