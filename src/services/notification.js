const prisma = require('../config/prisma');

// Pass a transaction client (tx) so the notification commits/rolls back with the action that caused it.
exports.notify = (db, { userId, type, title, message, invitationId, campaignId }) =>
  (db || prisma).notification.create({ data: { userId, type, title, message, invitationId, campaignId } });

exports.notifyMany = (db, items) =>
  items.length ? (db || prisma).notification.createMany({ data: items }) : Promise.resolve({ count: 0 });
