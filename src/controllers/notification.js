const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const parseId = require('../utils/id');

const readFilter = (q) => {
  if (q.isRead === undefined) return {};
  const v = String(q.isRead).toLowerCase();
  if (v !== 'true' && v !== 'false') throw new AppError(400, 'isRead must be true or false');
  return { isRead: v === 'true' };
};

// GET /notifications?isRead=&limit=&offset=  (own only, newest first)
exports.list = async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  const where = { userId: req.user.id, ...readFilter(req.query) };
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { id: 'desc' }, take: limit, skip: offset }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);
  res.json({ total, unreadCount, limit, offset, notifications });
};

exports.unreadCount = async (req, res) => {
  res.json({ unreadCount: await prisma.notification.count({ where: { userId: req.user.id, isRead: false } }) });
};

// PATCH /notifications/:id/read  (idempotent)
exports.markRead = async (req, res) => {
  const id = parseId(req.params.id);
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) throw new AppError(404, 'Notification not found');
  if (n.userId !== req.user.id) throw new AppError(403, 'This notification does not belong to you');
  const notification = n.isRead ? n
    : await prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  res.json({ notification });
};

// PATCH /notifications/read-all
exports.markAllRead = async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false }, data: { isRead: true, readAt: new Date() },
  });
  res.json({ updated: count });
};
