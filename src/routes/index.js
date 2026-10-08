const r = require('express').Router();
const h = require('../utils/asyncHandler');
const v = require('../validators');
const v4 = require('../validators/day4');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const wrap = (c) => Object.fromEntries(Object.entries(c).map(([k, f]) => [k, h(f)]));
const A = wrap(require('../controllers/auth')), C = wrap(require('../controllers/creator')),
  B = wrap(require('../controllers/brand')), S = wrap(require('../controllers/social')),
  P = wrap(require('../controllers/campaign')), I = wrap(require('../controllers/invitation')),
  D = wrap(require('../controllers/directory')), N = wrap(require('../controllers/notification'));

r.post('/auth/register', validate(v.register), A.register);
r.post('/auth/login', validate(v.login), A.login);
r.get('/auth/me', authenticate, A.me);

const creatorOnly = [authenticate, requireRole('CREATOR')];
const brandOnly = [authenticate, requireRole('BRAND')];

r.post('/creators/profile', ...creatorOnly, validate(v.creatorCreate), C.create);
r.get('/creators/profile', ...creatorOnly, C.getMine);
r.put('/creators/profile', ...creatorOnly, validate(v.creatorUpdate), C.update);
r.get('/creators', ...brandOnly, D.listCreators);
r.get('/creators/:id', authenticate, C.getById);

r.post('/brands/profile', ...brandOnly, validate(v.brandCreate), B.create);
r.get('/brands/profile', ...brandOnly, B.getMine);
r.put('/brands/profile', ...brandOnly, validate(v.brandUpdate), B.update);
r.get('/brands/:id', authenticate, B.getById);

r.get('/social-accounts', ...creatorOnly, S.list);
r.post('/social-accounts', ...creatorOnly, validate(v.socialCreate), S.create);
r.get('/social-accounts/:id', ...creatorOnly, S.getOne);
r.put('/social-accounts/:id', ...creatorOnly, validate(v.socialUpdate), S.update);
r.delete('/social-accounts/:id', ...creatorOnly, S.remove);

r.post('/campaigns', ...brandOnly, validate(v4.campaignCreate), P.create);
r.get('/campaigns', ...brandOnly, P.list);
r.get('/campaigns/:id', ...brandOnly, P.getOne);
r.put('/campaigns/:id', ...brandOnly, validate(v4.campaignUpdate), P.update);

r.post('/invitations', ...brandOnly, validate(v4.invitationCreate), I.create);
r.get('/invitations/sent', ...brandOnly, I.sent);
r.get('/invitations/received', ...creatorOnly, I.received);
r.get('/invitations/:id', authenticate, requireRole('BRAND', 'CREATOR'), I.getOne);
r.patch('/invitations/:id/respond', ...creatorOnly, validate(v4.invitationRespond), I.respond);
r.patch('/invitations/:id/withdraw', ...brandOnly, I.withdraw);

// Notifications: any authenticated user, own data only (static routes before :id)
r.get('/notifications', authenticate, N.list);
r.get('/notifications/unread-count', authenticate, N.unreadCount);
r.patch('/notifications/read-all', authenticate, N.markAllRead);
r.patch('/notifications/:id/read', authenticate, N.markRead);
module.exports = r;
