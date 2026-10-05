const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Authentication: verifies Bearer JWT and loads the user
exports.authenticate = asyncHandler(async (req, _res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw new AppError(401, 'Missing or malformed Authorization header');
  let payload;
  try { payload = jwt.verify(h.slice(7), process.env.JWT_SECRET); }
  catch { throw new AppError(401, 'Invalid or expired token'); }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new AppError(401, 'User no longer exists');
  req.user = user;
  next();
});

// Authorization: restricts a route to given roles
exports.requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError(403, `Forbidden: requires role ${roles.join(' or ')}`));
