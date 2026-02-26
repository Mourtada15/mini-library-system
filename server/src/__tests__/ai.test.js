const request = require('supertest');
process.env.NODE_ENV = 'test';

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

jest.mock('../models/AiLog', () => ({
  create: jest.fn(async () => ({})),
}));

let mockBooks;

jest.mock('../models/Book', () => {
  const chain = (result) => ({
    limit: async () => result,
  });

  return {
    deleteMany: jest.fn(async () => ({})),
    create: jest.fn(async (doc) => {
      const created = { _id: String(Date.now()), status: 'AVAILABLE', ...doc };
      mockBooks.push(created);
      return created;
    }),
    find: jest.fn(() => chain(mockBooks)),
  };
});

const Book = require('../models/Book');

describe('AI routes', () => {
  beforeAll(async () => {
    // eslint-disable-next-line global-require
    global.__app = require('../server');
  });

  beforeEach(async () => {
    mockBooks = [{ _id: 'b1', title: 'Test AI Book', author: 'AI Author', status: 'AVAILABLE' }];
  });

  test('POST /api/ai/smart-search returns books and explanation', async () => {
    const res = await request(global.__app)
      .post('/api/ai/smart-search')
      .set('x-test-user-role', 'MEMBER')
      .send({ query: 'find test book' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.books)).toBe(true);
    expect(res.body.explanation).toBeDefined();
  });
});

