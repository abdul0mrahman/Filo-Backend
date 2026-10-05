require('dotenv').config();
const express = require('express'), cors = require('cors'), helmet = require('helmet');
const { notFound, errorHandler } = require('./middleware/error');
const app = express();
app.use(helmet(), cors(), express.json({ limit: '100kb' }));
app.get('/', (_q, res) => res.json({ status: 'ok', service: 'filo-backend' }));
app.use('/', require('./routes'));
app.use(notFound, errorHandler);
module.exports = app;
