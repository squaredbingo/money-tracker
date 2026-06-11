require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');

const port = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();
