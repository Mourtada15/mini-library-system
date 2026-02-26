const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../ai/provider', () => ({
  generateText: jest.fn(async ({ prompt }) => ({
    text:
      prompt.indexOf('filters') !== -1
        ? JSON.stringify({
            filters: { title: 'Test', author: null, isbn: null, genre: null, tags: null, year: null, availability: null },
            explanation: 'Matched test books',
          })
        : JSON.stringify({
            tags: ['tag1', 'tag2'],
            genre: 'Fiction',
            summary: 'Summary text',
          }),
    provider: 'mock',
    model: 'mock-model',
  })),
}));

const app = require('../server');
const Book = require('../models/Book');

describe('AI routes', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini-library-test-ai';
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Book.deleteMany({});
    await Book.create({
      title: 'Test AI Book',
      author: 'AI Author',
      status: 'AVAILABLE',
    });
  });

  test('POST /api/ai/smart-search returns books and explanation', async () => {
    const res = await request(app)
      .post('/api/ai/smart-search')
      .set('x-test-user-role', 'MEMBER')
      .send({ query: 'find test book' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.books)).toBe(true);
    expect(res.body.explanation).toBeDefined();
  });
});

