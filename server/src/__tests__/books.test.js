const request = require('supertest');
process.env.NODE_ENV = 'test';

jest.mock('../models/CheckoutLog', () => ({
  create: jest.fn(async () => ({})),
}));

let mockBooks;

jest.mock('../models/Book', () => {
  const chain = (result) => ({
    sort: () => chain(result),
    skip: () => chain(result),
    limit: async () => result,
  });

  return {
    find: jest.fn(() => chain(mockBooks)),
    countDocuments: jest.fn(async () => mockBooks.length),
    deleteMany: jest.fn(async () => ({})),
    create: jest.fn(async (doc) => {
      const created = { _id: String(Date.now()), status: 'AVAILABLE', ...doc };
      mockBooks.push(created);
      return created;
    }),
    findOne: jest.fn(async (filter) => mockBooks.find((b) => b.title === filter.title)),
    findById: jest.fn(async (id) => {
      const found = mockBooks.find((b) => String(b._id) === String(id));
      if (!found) return null;
      return {
        ...found,
        save: jest.fn(async function save() {
          const idx = mockBooks.findIndex((b) => String(b._id) === String(id));
          mockBooks[idx] = { ...mockBooks[idx], ...this };
          return mockBooks[idx];
        }),
      };
    }),
    findByIdAndUpdate: jest.fn(async (id, update) => {
      const idx = mockBooks.findIndex((b) => String(b._id) === String(id));
      if (idx === -1) return null;
      mockBooks[idx] = { ...mockBooks[idx], ...update };
      return mockBooks[idx];
    }),
    findByIdAndDelete: jest.fn(async (id) => {
      const idx = mockBooks.findIndex((b) => String(b._id) === String(id));
      if (idx === -1) return null;
      const [deleted] = mockBooks.splice(idx, 1);
      return deleted;
    }),
  };
});

const Book = require('../models/Book');

describe('Books API', () => {
  beforeAll(async () => {
     
    global.__app = require('../server');
  });

  beforeEach(async () => {
    mockBooks = [
      {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Book',
        author: 'Author One',
        status: 'AVAILABLE',
      },
    ];
  });

  test('GET /api/books returns list of books', async () => {
    const res = await request(global.__app).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/books creates a book as ADMIN', async () => {
    const res = await request(global.__app)
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

    const checkoutRes = await request(global.__app)
      .post(`/api/books/${book._id}/checkout`)
      .set('x-test-user-role', 'LIBRARIAN')
      .send({});

    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.status).toBe('BORROWED');

    const checkinRes = await request(global.__app)
      .post(`/api/books/${book._id}/checkin`)
      .set('x-test-user-role', 'LIBRARIAN')
      .send();

    expect(checkinRes.status).toBe(200);
    expect(checkinRes.body.status).toBe('AVAILABLE');
  });
});

