const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const mine = async (userId) => {
  const p = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!p) throw new AppError(404, 'Brand profile not found. Create it first.');
  return p;
};
exports.create = async (req, res) => {
  if (await prisma.brandProfile.findUnique({ where: { userId: req.user.id } })) throw new AppError(409, 'Brand profile already exists');
  res.status(201).json({ profile: await prisma.brandProfile.create({ data: { ...req.body, userId: req.user.id } }) });
};
exports.getMine = async (req, res) => res.json({ profile: await mine(req.user.id) });
exports.update = async (req, res) => {
  await mine(req.user.id);
  res.json({ profile: await prisma.brandProfile.update({ where: { userId: req.user.id }, data: req.body }) });
};
exports.getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError(400, 'Invalid id');
  const profile = await prisma.brandProfile.findUnique({ where: { id } });
  if (!profile) throw new AppError(404, 'Brand profile not found');
  res.json({ profile });
};
