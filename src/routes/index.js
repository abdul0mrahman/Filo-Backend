const r = require('express').Router();
const h = require('../utils/asyncHandler');
const v = require('../validators');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const auth = require('../controllers/auth'), creator = require('../controllers/creator'),
  brand = require('../controllers/brand'), social = require('../controllers/social');
const wrap = (c) => Object.fromEntries(Object.entries(c).map(([k, f]) => [k, h(f)]));
const A = wrap(auth), C = wrap(creator), B = wrap(brand), S = wrap(social);

r.post('/auth/register', validate(v.register), A.register);
r.post('/auth/login', validate(v.login), A.login);
r.get('/auth/me', authenticate, A.me);

const creatorOnly = [authenticate, requireRole('CREATOR')];
r.post('/creators/profile', ...creatorOnly, validate(v.creatorCreate), C.create);
r.get('/creators/profile', ...creatorOnly, C.getMine);
r.put('/creators/profile', ...creatorOnly, validate(v.creatorUpdate), C.update);
r.get('/creators/:id', authenticate, C.getById);

const brandOnly = [authenticate, requireRole('BRAND')];
r.post('/brands/profile', ...brandOnly, validate(v.brandCreate), B.create);
r.get('/brands/profile', ...brandOnly, B.getMine);
r.put('/brands/profile', ...brandOnly, validate(v.brandUpdate), B.update);
r.get('/brands/:id', authenticate, B.getById);

r.get('/social-accounts', ...creatorOnly, S.list);
r.post('/social-accounts', ...creatorOnly, validate(v.socialCreate), S.create);
r.put('/social-accounts/:id', ...creatorOnly, validate(v.socialUpdate), S.update);
r.delete('/social-accounts/:id', ...creatorOnly, S.remove);
module.exports = r;
