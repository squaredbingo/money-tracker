require('dotenv').config()
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const smsRoutes = require('./src/routes/sms');
const transactionRoutes = require('./src/routes/transactions');
const insightRoutes = require('./src/routes/insights');
const connectDB = require('./src/config/db');


connectDB();
app.use(express.json());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/sms', smsRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/insights', insightRoutes);

app.get('/', (req, res) => {
  res.send('Hello from Money Tracker!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
