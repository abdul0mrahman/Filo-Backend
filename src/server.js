const app = require('./app');
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) { console.error('Set DATABASE_URL and JWT_SECRET in .env'); process.exit(1); }
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Filo API running on http://localhost:${port}`));
