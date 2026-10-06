const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const parseId = require('../utils/id');

const brandOf = async (userId) => {
  const b = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!b) throw new AppError(404, 'Brand profile not found. Create it first.');
  return b;
};
exports.brandOf = brandOf;

const owned = async (req) => {
  const brand = await brandOf(req.user.id);
  const c = await prisma.campaign.findUnique({ where: { id: parseId(req.params.id) } });
  if (!c) throw new AppError(404, 'Campaign not found');
  if (c.brandId !== brand.id) throw new AppError(403, 'You do not own this campaign');
  return c;
};
exports.create = async (req, res) => {
  const brand = await brandOf(req.user.id);
  res.status(201).json({ campaign: await prisma.campaign.create({ data: { ...req.body, brandId: brand.id } }) });
};
exports.list = async (req, res) => {
  const brand = await brandOf(req.user.id);
  res.json({ campaigns: await prisma.campaign.findMany({ where: { brandId: brand.id }, orderBy: { id: 'desc' } }) });
};
exports.getOne = async (req, res) => res.json({ campaign: await owned(req) });
exports.update = async (req, res) => {
  const c = await owned(req);
  res.json({ campaign: await prisma.campaign.update({ where: { id: c.id }, data: req.body }) });
};
