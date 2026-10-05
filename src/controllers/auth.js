const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const safe = ({ passwordHash, ...u }) => u;
const sign = (u) => jwt.sign({ sub: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await prisma.user.findUnique({ where: { email } })) throw new AppError(409, 'Email already registered');
  const user = await prisma.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) } });
  res.status(201).json({ user: safe(user), token: sign(user) });
};
exports.login = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new AppError(401, 'Invalid email or password');
  res.json({ user: safe(user), token: sign(user) });
};
exports.me = async (req, res) => res.json({ user: safe(req.user) });
