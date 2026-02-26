/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set (use MongoDB Atlas or local MongoDB)');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Book.deleteMany({});

  const [admin, librarian, member1, member2] = await User.create([
    {
      googleId: 'admin-google-id',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
    {
      googleId: 'librarian-google-id',
      email: 'librarian@example.com',
      name: 'Librarian User',
      role: 'LIBRARIAN',
    },
    {
      googleId: 'member1-google-id',
      email: 'member1@example.com',
      name: 'Member One',
      role: 'MEMBER',
    },
    {
      googleId: 'member2-google-id',
      email: 'member2@example.com',
      name: 'Member Two',
      role: 'MEMBER',
    },
  ]);

  console.log('Created users:', admin.email, librarian.email);

  const sampleBooks = [
    {
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt',
      genre: 'Technology',
      tags: ['programming', 'software'],
      year: 1999,
    },
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      genre: 'Technology',
      tags: ['programming', 'best practices'],
      year: 2008,
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      genre: 'Fiction',
      tags: ['classic', 'justice'],
      year: 1960,
    },
    {
      title: '1984',
      author: 'George Orwell',
      genre: 'Fiction',
      tags: ['dystopia', 'politics'],
      year: 1949,
    },
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genre: 'Fiction',
      tags: ['classic', 'american'],
      year: 1925,
    },
    {
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      genre: 'History',
      tags: ['history', 'evolution'],
      year: 2011,
    },
    {
      title: 'The Lean Startup',
      author: 'Eric Ries',
      genre: 'Business',
      tags: ['startup', 'business'],
      year: 2011,
    },
    {
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      genre: 'Psychology',
      tags: ['behavior', 'cognition'],
      year: 2011,
    },
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      genre: 'Fantasy',
      tags: ['fantasy', 'adventure'],
      year: 1937,
    },
    {
      title: 'The Lord of the Rings',
      author: 'J.R.R. Tolkien',
      genre: 'Fantasy',
      tags: ['fantasy', 'epic'],
      year: 1954,
    },
    {
      title: 'Dune',
      author: 'Frank Herbert',
      genre: 'Science Fiction',
      tags: ['sci-fi', 'epic'],
      year: 1965,
    },
    {
      title: 'The Phoenix Project',
      author: 'Gene Kim',
      genre: 'Business',
      tags: ['devops', 'it'],
      year: 2013,
    },
    {
      title: 'Deep Work',
      author: 'Cal Newport',
      genre: 'Productivity',
      tags: ['focus', 'productivity'],
      year: 2016,
    },
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      genre: 'Self-help',
      tags: ['habits', 'self-improvement'],
      year: 2018,
    },
    {
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      genre: 'Technology',
      tags: ['databases', 'systems'],
      year: 2017,
    },
  ].map((b) => ({
    ...b,
    status: 'AVAILABLE',
    createdBy: librarian._id,
  }));

  await Book.insertMany(sampleBooks);
  console.log('Inserted sample books');

  await mongoose.disconnect();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

