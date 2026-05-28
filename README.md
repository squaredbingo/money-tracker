# Money Tracker

AI-powered expense analytics for SMS banking messages, built with Node.js, Express, MongoDB, and a static dashboard.

## What it does

- Parses SMS messages for transaction data.
- Stores parsed transactions in MongoDB.
- Provides transaction CRUD endpoints.
- Aggregates analytics for expenses, income, categories, trends, and top senders.
- Renders a static dashboard from `public/index.html`.

## Key features

- `POST /api/sms` — receive and store a single SMS transaction.
- `POST /api/sms/bulk` — receive and store multiple SMS transactions.
- `POST /api/sms/seed` — seed the database from sample SMS data.
- `GET /api/transactions` — list all stored transactions.
- `GET /api/transactions/:id` — retrieve a specific transaction.
- `PUT /api/transactions/:id` — update a stored transaction.
- `DELETE /api/transactions/:id` — remove a transaction.
- `GET /api/insights` — return aggregated analytics data.

## Tech stack

- Node.js + Express
- MongoDB + Mongoose
- Static frontend in `public/`
- Environment configuration via `dotenv`

## Project structure

- `index.js` — Express app entrypoint
- `src/config/db.js` — MongoDB connection
- `src/controllers/` — request handlers and business logic
- `src/routes/` — Express API routing
- `src/models/Transaction.js` — Mongoose transaction schema
- `src/services/smsParser.js` — SMS parsing and auto-categorization
- `src/data/sampleSMS.js` — sample SMS data for seeding
- `public/` — dashboard frontend

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:

   Create a `.env` file in the project root with:

   ```text
   MONGO_URI=mongodb://localhost:27017/money-tracker
   PORT=3000
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open the dashboard in your browser:

   ```text
   http://localhost:3000
   ```

## API usage

### Seed transactions

```bash
curl -X POST http://localhost:3000/api/sms/seed
```

### Create a transaction from SMS

```bash
curl -X POST http://localhost:3000/api/sms \
  -H "Content-Type: application/json" \
  -d '{"sender":"HDFCBank","message":"Rs.500.00 debited from account XX1234 on 25-May-2026. Balance Rs.4,500.00"}'
```

### List transactions

```bash
curl http://localhost:3000/api/transactions
```

### Get insights

```bash
curl http://localhost:3000/api/insights
```

## Notes

- SMS parsing is handled by `src/services/smsParser.js` and uses regex-based extraction.
- Transactions are stored in MongoDB and automatically include timestamps.
- The dashboard pulls analytics from backend endpoints and renders charts client-side.

## Suggested improvements

- Add user authentication and per-user data storage.
- Add a real SMS webhook integration (e.g. Twilio) instead of manual POST ingestion.
- Improve parser coverage for more banks and message formats.
- Add date-range filtering, budgets, export/import, and transaction search.
- Add tests for parser, routes, and analytics logic.
