// server.js
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4242;

// Mount webhook FIRST so raw body is preserved for signature verification
app.use('/webhook', require('./routes/webhook'));

// JSON parser for the rest
app.use(express.json());

// Other routes
app.use('/create-checkout-session', require('./routes/checkout'));

app.get('/', (_req, res) => res.send('AutoCaption Pro Backend (E2E Simulation) Running'));

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
