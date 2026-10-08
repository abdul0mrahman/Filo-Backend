const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const parseId = require('../utils/id');
const { brandOf } = require('./campaign');
const { notify } = require('../services/notification');

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
  const creator = await prisma.creatorProfile.findUnique({ where: { id: creatorId } });
  if (!creator) throw new AppError(404, 'Creator not found');
  if (await prisma.invitation.findUnique({ where: { campaignId_creatorId: { campaignId, creatorId } } }))
    throw new AppError(409, 'This creator has already been invited to this campaign');
  const invitation = await prisma.$transaction(async (tx) => {
    const inv = await tx.invitation.create({ data: { campaignId, creatorId, message, brandId: brand.id }, include });
    await notify(tx, {
      userId: creator.userId, type: 'INVITATION_RECEIVED', invitationId: inv.id, campaignId,
      title: 'New campaign invitation',
      message: `${brand.companyName} invited you to "${campaign.title}"`,
    });
    return inv;
  });
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
  const status = req.body.status;
  const brandProfile = await prisma.brandProfile.findUnique({ where: { id: inv.brandId } });
  const invitation = await prisma.$transaction(async (tx) => {
    // atomic guard: only one response can win if two requests race
    const { count } = await tx.invitation.updateMany({
      where: { id: inv.id, status: 'PENDING' }, data: { status, respondedAt: new Date() },
    });
    if (!count) throw new AppError(409, 'Invitation already responded to or withdrawn');
    await notify(tx, {
      userId: brandProfile.userId, type: `INVITATION_${status}`, invitationId: inv.id, campaignId: inv.campaignId,
      title: `Invitation ${status.toLowerCase()}`,
      message: `${creator.displayName} ${status === 'ACCEPTED' ? 'accepted' : 'rejected'} your invitation to "${inv.campaign.title}"`,
    });
    return tx.invitation.findUnique({ where: { id: inv.id }, include });
  });
  res.json({ invitation });
};
// BRAND: withdraw a pending invitation
exports.withdraw = async (req, res) => {
  const brand = await brandOf(req.user.id);
  const inv = await load(parseId(req.params.id));
  if (inv.brandId !== brand.id) throw new AppError(403, 'You did not send this invitation');
  if (inv.status !== 'PENDING') throw new AppError(409, `Invitation already ${inv.status.toLowerCase()}`);
  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { id: inv.creatorId } });
  const invitation = await prisma.$transaction(async (tx) => {
    const { count } = await tx.invitation.updateMany({ where: { id: inv.id, status: 'PENDING' }, data: { status: 'WITHDRAWN' } });
    if (!count) throw new AppError(409, 'Invitation already responded to or withdrawn');
    await notify(tx, {
      userId: creatorProfile.userId, type: 'INVITATION_WITHDRAWN', invitationId: inv.id, campaignId: inv.campaignId,
      title: 'Invitation withdrawn',
      message: `${brand.companyName} withdrew their invitation to "${inv.campaign.title}"`,
    });
    return tx.invitation.findUnique({ where: { id: inv.id }, include });
  });
  res.json({ invitation });
};
