const app = require('./server');
const { connectDb } = require('./lib/db');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDb();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});

