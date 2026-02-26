const app = require('./server');
const { connectDb } = require('./lib/db');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDb();
  app.listen(PORT, () => {
     
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((err) => {
   
  console.error('Failed to start server', err);
  process.exit(1);
});

