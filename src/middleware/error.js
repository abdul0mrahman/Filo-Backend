const { ZodError } = require('zod');
exports.notFound = (req, res) => res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
exports.errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError)
    return res.status(400).json({ error: 'Validation failed', details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })) });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err.code === 'P2002') return res.status(409).json({ error: 'Resource already exists' });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Resource not found' });
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
