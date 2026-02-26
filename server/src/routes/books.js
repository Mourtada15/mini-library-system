const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const CheckoutLog = require('../models/CheckoutLog');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const {
  createBookSchema,
  updateBookSchema,
  checkoutSchema,
} = require('../validation/bookValidation');

const router = express.Router();

function buildBookQuery(query) {
  const filter = {};

  if (query.q) {
    const regex = new RegExp(query.q, 'i');
    filter.$or = [
      { title: regex },
      { author: regex },
      { isbn: regex },
      { genre: regex },
      { tags: regex },
    ];
  }

  if (query.availability) {
    if (query.availability.toUpperCase() === 'AVAILABLE') {
      filter.status = 'AVAILABLE';
    }
    if (query.availability.toUpperCase() === 'BORROWED') {
      filter.status = 'BORROWED';
    }
  }

  if (query.genre) {
    filter.genre = query.genre;
  }

  if (query.year) {
    const year = parseInt(query.year, 10);
    if (!Number.isNaN(year)) {
      filter.year = year;
    }
  }

  return filter;
}

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const sortField = req.query.sort || 'createdAt';
    const sortDir = req.query.order === 'asc' ? 1 : -1;

    const filter = buildBookQuery(req.query);

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      Book.countDocuments(filter),
    ]);

    res.json({
      data: books,
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid book id' });
    }
    const book = await Book.findById(req.params.id)
      .populate('borrowedBy', 'name email role')
      .populate('createdBy', 'name email role');

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.json(book);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'LIBRARIAN'),
  validateBody(createBookSchema),
  async (req, res, next) => {
    try {
      const book = await Book.create({
        ...req.body,
        createdBy: req.user._id,
      });
      res.status(201).json(book);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN', 'LIBRARIAN'),
  validateBody(updateBookSchema),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid book id' });
      }
      const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      return res.json(book);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid book id' });
      }
      const book = await Book.findByIdAndDelete(req.params.id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/checkout',
  requireAuth,
  requireRole('ADMIN', 'LIBRARIAN', 'MEMBER'),
  validateBody(checkoutSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid book id' });
      }

      const book = await Book.findById(id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      const isAdminOrLibrarian =
        req.user.role === 'ADMIN' || req.user.role === 'LIBRARIAN';

      let borrowerId;
      if (isAdminOrLibrarian && req.body.userId) {
        borrowerId = req.body.userId;
      } else {
        borrowerId = req.user._id;
      }

      if (book.status === 'BORROWED') {
        if (!(isAdminOrLibrarian && req.body.override)) {
          return res
            .status(400)
            .json({ message: 'Book is already borrowed' });
        }
      }

      const days =
        parseInt(process.env.DEFAULT_LOAN_DAYS, 10) || 14;
      const now = new Date();
      const due = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      book.status = 'BORROWED';
      book.borrowedBy = borrowerId;
      book.borrowedAt = now;
      book.dueAt = due;
      await book.save();

      await CheckoutLog.create({
        bookId: book._id,
        userId: borrowerId,
        action: 'CHECKOUT',
      });

      return res.json(book);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/checkin',
  requireAuth,
  requireRole('ADMIN', 'LIBRARIAN'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid book id' });
      }

      const book = await Book.findById(id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      if (book.status !== 'BORROWED') {
        return res
          .status(400)
          .json({ message: 'Book is not currently borrowed' });
      }

      const borrowerId = book.borrowedBy;

      book.status = 'AVAILABLE';
      book.borrowedBy = null;
      book.borrowedAt = null;
      book.dueAt = null;
      await book.save();

      if (borrowerId) {
        await CheckoutLog.create({
          bookId: book._id,
          userId: borrowerId,
          action: 'CHECKIN',
        });
      }

      return res.json(book);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

