const prisma = require('../config/prisma');
// BRAND: browse creators to invite (?niche=&limit=&offset=)
exports.listCreators = async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  const where = req.query.niche ? { niche: { contains: String(req.query.niche), mode: 'insensitive' } } : {};
  const [creators, total] = await Promise.all([
    prisma.creatorProfile.findMany({ where, include: { socials: true }, take: limit, skip: offset, orderBy: { id: 'asc' } }),
    prisma.creatorProfile.count({ where }),
  ]);
  res.json({ total, limit, offset, creators });
};
