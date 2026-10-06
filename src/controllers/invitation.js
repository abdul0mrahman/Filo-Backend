const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const parseId = require('../utils/id');
const { brandOf } = require('./campaign');

const include = {
  campaign: { select: { id: true, title: true, status: true, budget: true, deadline: true } },
  creator: { select: { id: true, displayName: true, niche: true } },
  brand: { select: { id: true, companyName: true } },
};
const STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];
const creatorOf = async (userId) => {
  const c = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!c) throw new AppError(404, 'Creator profile not found. Create it first.');
  return c;
};
const statusFilter = (q) => {
  if (!q.status) return {};
  const s = String(q.status).toUpperCase();
  if (!STATUSES.includes(s)) throw new AppError(400, `status must be one of ${STATUSES.join(', ')}`);
  return { status: s };
};
const load = async (id) => {
  const inv = await prisma.invitation.findUnique({ where: { id }, include });
  if (!inv) throw new AppError(404, 'Invitation not found');
  return inv;
};

// BRAND: send invitation
exports.create = async (req, res) => {
  const brand = await brandOf(req.user.id);
  const { campaignId, creatorId, message } = req.body;
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.brandId !== brand.id) throw new AppError(404, 'Campaign not found');
  if (campaign.status !== 'ACTIVE') throw new AppError(409, 'Cannot invite to a closed campaign');
  if (!(await prisma.creatorProfile.findUnique({ where: { id: creatorId } }))) throw new AppError(404, 'Creator not found');
  if (await prisma.invitation.findUnique({ where: { campaignId_creatorId: { campaignId, creatorId } } }))
    throw new AppError(409, 'This creator has already been invited to this campaign');
  const invitation = await prisma.invitation.create({ data: { campaignId, creatorId, message, brandId: brand.id }, include });
  res.status(201).json({ invitation });
};
// BRAND: invitations I sent
exports.sent = async (req, res) => {
  const brand = await brandOf(req.user.id);
  res.json({ invitations: await prisma.invitation.findMany({ where: { brandId: brand.id, ...statusFilter(req.query) }, include, orderBy: { id: 'desc' } }) });
};
// CREATOR: invitations I received
exports.received = async (req, res) => {
  const creator = await creatorOf(req.user.id);
  res.json({ invitations: await prisma.invitation.findMany({ where: { creatorId: creator.id, ...statusFilter(req.query) }, include, orderBy: { id: 'desc' } }) });
};
// BRAND (sender) or CREATOR (recipient)
exports.getOne = async (req, res) => {
  const inv = await load(parseId(req.params.id));
  const mineId = req.user.role === 'BRAND'
    ? (await brandOf(req.user.id)).id : (await creatorOf(req.user.id)).id;
  const allowed = req.user.role === 'BRAND' ? inv.brandId === mineId : inv.creatorId === mineId;
  if (!allowed) throw new AppError(403, 'You do not have access to this invitation');
  res.json({ invitation: inv });
};
// CREATOR: accept / reject
exports.respond = async (req, res) => {
  const creator = await creatorOf(req.user.id);
  const inv = await load(parseId(req.params.id));
  if (inv.creatorId !== creator.id) throw new AppError(403, 'This invitation was not sent to you');
  if (inv.status !== 'PENDING') throw new AppError(409, `Invitation already ${inv.status.toLowerCase()}`);
  const invitation = await prisma.invitation.update({ where: { id: inv.id }, data: { status: req.body.status, respondedAt: new Date() }, include });
  res.json({ invitation });
};
// BRAND: withdraw a pending invitation
exports.withdraw = async (req, res) => {
  const brand = await brandOf(req.user.id);
  const inv = await load(parseId(req.params.id));
  if (inv.brandId !== brand.id) throw new AppError(403, 'You did not send this invitation');
  if (inv.status !== 'PENDING') throw new AppError(409, `Invitation already ${inv.status.toLowerCase()}`);
  const invitation = await prisma.invitation.update({ where: { id: inv.id }, data: { status: 'WITHDRAWN' }, include });
  res.json({ invitation });
};
