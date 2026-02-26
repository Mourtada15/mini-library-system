const express = require('express');
const mongoose = require('mongoose');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateText, generateMockSmartSearch, generateMockEnrichBook } = require('../ai/provider');
const { buildSmartSearchPrompt, buildEnrichBookPrompt } = require('../ai/prompts');
const Book = require('../models/Book');
const AiLog = require('../models/AiLog');

const router = express.Router();

function safeJsonParse(text, fallback) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return parsed;
  } catch (e) {
    return fallback;
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

    let text;
    let provider;
    let model;
    let providerUsed;

    try {
      const result = await generateText({ prompt, endpoint: 'smart-search' });
      text = result.text;
      provider = result.provider;
      model = result.model;
      providerUsed = provider;
    } catch (err) {
      // Fallback to mock behavior
      const payload = generateMockSmartSearch(prompt);
      text = JSON.stringify(payload);
      provider = 'mock';
      model = 'mock';
      providerUsed = 'mock';
    }

    const fallbackParsed = {
      filters: {},
      explanation: 'Search results based on your query.',
    };

    const parsed = safeJsonParse(text, fallbackParsed);
    const filters = parsed.filters || {};
    const explanation = parsed.explanation || fallbackParsed.explanation;

    const mongoFilter = {};

    // Support both original filter shape and the simplified mock shape
    if (
      filters.title ||
      filters.author ||
      filters.isbn ||
      filters.genre ||
      filters.tags ||
      filters.availability ||
      filters.year
    ) {
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
    } else {
      const { q, status, genre, year } = filters;
      if (q) {
        const regex = new RegExp(q, 'i');
        mongoFilter.$or = [
          { title: regex },
          { author: regex },
          { isbn: regex },
          { genre: regex },
          { tags: regex },
        ];
      }
      if (genre) {
        mongoFilter.genre = genre;
      }
      if (typeof year === 'number') {
        mongoFilter.year = year;
      }
      if (status && status !== 'ALL') {
        mongoFilter.status = status;
      }
    }

    const books = await Book.find(mongoFilter).limit(20);

    await AiLog.create({
      userId: req.user ? req.user._id : undefined,
      endpoint: 'smart-search',
      provider: providerUsed,
      model,
      promptLength: prompt.length,
      responseLength: text.length,
    });

    return res.json({
      books,
      explanation,
      filters,
      providerUsed,
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

      let text;
      let provider;
      let model;
      let providerUsed;

      try {
        const result = await generateText({
          prompt,
          endpoint: 'enrich-book',
          context: book,
        });
        text = result.text;
        provider = result.provider;
        model = result.model;
        providerUsed = provider;
      } catch (err) {
        const payload = generateMockEnrichBook(book);
        text = JSON.stringify(payload);
        provider = 'mock';
        model = 'mock';
        providerUsed = 'mock';
      }

      const parsed = safeJsonParse(text, {});
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
        provider: providerUsed,
        model,
        promptLength: prompt.length,
        responseLength: text.length,
      });

      return res.json({
        ...book.toObject(),
        providerUsed,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

