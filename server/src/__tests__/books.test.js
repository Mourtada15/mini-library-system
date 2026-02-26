const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Book = require('../models/Book');

describe('Books API', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini-library-test';
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Book.deleteMany({});
    await Book.create({
      title: 'Test Book',
      author: 'Author One',
      status: 'AVAILABLE',
    });
  });

  test('GET /api/books returns list of books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/books creates a book as ADMIN', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('x-test-user-role', 'ADMIN')
      .send({
        title: 'New Book',
        author: 'Author Two',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Book');
  });

  test('checkout and checkin flow', async () => {
    const book = await Book.findOne({ title: 'Test Book' });

    const checkoutRes = await request(app)
      .post(`/api/books/${book._id}/checkout`)
      .set('x-test-user-role', 'LIBRARIAN')
      .send({});

    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.status).toBe('BORROWED');

    const checkinRes = await request(app)
      .post(`/api/books/${book._id}/checkin`)
      .set('x-test-user-role', 'LIBRARIAN')
      .send();

    expect(checkinRes.status).toBe(200);
    expect(checkinRes.body.status).toBe('AVAILABLE');
  });
});

