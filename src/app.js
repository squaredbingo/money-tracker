const express = require('express');
const path = require('path');
const smsRoutes = require('./routes/sms');
const transactionRoutes = require('./routes/transactions');
const insightRoutes = require('./routes/insights');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/sms', smsRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/insights', insightRoutes);

app.get('/', (req, res) => {
  res.send('Hello from Money Tracker!');
});

app.use(errorHandler);

module.exports = app;
