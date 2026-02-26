const mongoose = require('mongoose');

let isConnected = false;

async function connectDb() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
  });

  isConnected = true;
}

module.exports = { connectDb };

