const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const include = { socials: true };

const mine = async (userId) => {
  const p = await prisma.creatorProfile.findUnique({ where: { userId }, include });
  if (!p) throw new AppError(404, 'Creator profile not found. Create it first.');
  return p;
};
exports.mine = mine;
exports.create = async (req, res) => {
  if (await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } })) throw new AppError(409, 'Creator profile already exists');
  res.status(201).json({ profile: await prisma.creatorProfile.create({ data: { ...req.body, userId: req.user.id }, include }) });
};
exports.getMine = async (req, res) => res.json({ profile: await mine(req.user.id) });
exports.update = async (req, res) => {
  await mine(req.user.id);
  res.json({ profile: await prisma.creatorProfile.update({ where: { userId: req.user.id }, data: req.body, include }) });
};
exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError(400, 'Invalid id');
  const profile = await prisma.creatorProfile.findUnique({ where: { id }, include });
  if (!profile) throw new AppError(404, 'Creator profile not found');
  res.json({ profile });
};
