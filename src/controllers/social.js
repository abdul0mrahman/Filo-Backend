const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { mine } = require('./creator');

// Ownership check: account must belong to the logged-in creator
const owned = async (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError(400, 'Invalid id');
  const profile = await mine(req.user.id);
  const acc = await prisma.socialAccount.findUnique({ where: { id } });
  if (!acc) throw new AppError(404, 'Social account not found');
  if (acc.creatorId !== profile.id) throw new AppError(403, 'You do not own this social account');
  return acc;
};
exports.list = async (req, res) => {
  const p = await mine(req.user.id);
  res.json({ accounts: await prisma.socialAccount.findMany({ where: { creatorId: p.id }, orderBy: { id: 'asc' } }) });
};
exports.create = async (req, res) => {
  const p = await mine(req.user.id);
  res.status(201).json({ account: await prisma.socialAccount.create({ data: { ...req.body, creatorId: p.id } }) });
};
exports.update = async (req, res) => {
  const acc = await owned(req);
  res.json({ account: await prisma.socialAccount.update({ where: { id: acc.id }, data: req.body }) });
};
exports.remove = async (req, res) => {
  const acc = await owned(req);
  await prisma.socialAccount.delete({ where: { id: acc.id } });
  res.json({ message: 'Social account deleted' });
};
