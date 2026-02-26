const express = require('express');
const mongoose = require('mongoose');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateText } = require('../ai/provider');
const { buildSmartSearchPrompt, buildEnrichBookPrompt } = require('../ai/prompts');
const Book = require('../models/Book');
const AiLog = require('../models/AiLog');

const router = express.Router();

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

router.post('/smart-search', requireAuth, async (req, res, next) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'query is required' });
    }

    const maxLen = 500;
    const trimmedQuery = query.slice(0, maxLen);

    const prompt = buildSmartSearchPrompt(trimmedQuery);
    const { text, provider, model } = await generateText({ prompt });

    const parsed = safeParseJson(text);
    const filters = parsed && parsed.filters ? parsed.filters : {};
    const explanation =
      (parsed && parsed.explanation) || 'Search results based on your query.';

    const mongoFilter = {};

    if (filters.title) mongoFilter.title = new RegExp(filters.title, 'i');
    if (filters.author) mongoFilter.author = new RegExp(filters.author, 'i');
    if (filters.isbn) mongoFilter.isbn = new RegExp(filters.isbn, 'i');
    if (filters.genre) mongoFilter.genre = new RegExp(filters.genre, 'i');
    if (filters.year) mongoFilter.year = Number(filters.year);
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      mongoFilter.tags = { $in: filters.tags.map((t) => new RegExp(t, 'i')) };
    }
    if (filters.availability) {
      mongoFilter.status = filters.availability;
    }

    const books = await Book.find(mongoFilter).limit(20);

    await AiLog.create({
      userId: req.user ? req.user._id : undefined,
      endpoint: 'smart-search',
      provider,
      model,
      promptLength: prompt.length,
      responseLength: text.length,
    });

    return res.json({
      books,
      explanation,
      filters,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/enrich-book',
  requireAuth,
  requireRole('ADMIN', 'LIBRARIAN'),
  async (req, res, next) => {
    try {
      const { bookId } = req.body || {};
      if (!bookId || !mongoose.isValidObjectId(bookId)) {
        return res.status(400).json({ message: 'Valid bookId is required' });
      }

      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      const prompt = buildEnrichBookPrompt(book);
      const { text, provider, model } = await generateText({ prompt });

      const parsed = safeParseJson(text) || {};
      const tags = Array.isArray(parsed.tags) ? parsed.tags : [];
      const genre = parsed.genre || book.genre;
      const summary = parsed.summary || book.aiSummary;

      if (tags.length > 0) book.tags = tags;
      if (genre) book.genre = genre;
      if (summary) book.aiSummary = summary;

      await book.save();

      await AiLog.create({
        userId: req.user ? req.user._id : undefined,
        endpoint: 'enrich-book',
        provider,
        model,
        promptLength: prompt.length,
        responseLength: text.length,
      });

      return res.json(book);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

