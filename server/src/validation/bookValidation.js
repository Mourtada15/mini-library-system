const { Joi } = require('../middleware/validation');

const baseBook = {
  title: Joi.string().min(1).max(255),
  author: Joi.string().min(1).max(255),
  isbn: Joi.string().max(50).allow('', null),
  description: Joi.string().max(5000).allow('', null),
  genre: Joi.string().max(100).allow('', null),
  tags: Joi.array().items(Joi.string().max(50)).default([]),
  year: Joi.number().integer().min(0).max(new Date().getFullYear() + 1).allow(null),
};

const createBookSchema = Joi.object({
  ...baseBook,
  title: baseBook.title.required(),
  author: baseBook.author.required(),
});

const updateBookSchema = Joi.object({
  ...baseBook,
}).min(1);

const checkoutSchema = Joi.object({
  userId: Joi.string().optional(),
  override: Joi.boolean().default(false),
});

module.exports = {
  createBookSchema,
  updateBookSchema,
  checkoutSchema,
};

