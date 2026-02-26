const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String },
    description: { type: String },
    genre: { type: String },
    tags: [{ type: String }],
    year: { type: Number },
    status: {
      type: String,
      enum: ['AVAILABLE', 'BORROWED'],
      default: 'AVAILABLE',
    },
    borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    borrowedAt: { type: Date },
    dueAt: { type: Date },
    aiSummary: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', BookSchema);

