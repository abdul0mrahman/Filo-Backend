const { z } = require('zod');
const opt = (s) => s.optional();
const url = z.string().url('Must be a valid URL').max(500);

exports.register = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72)
    .regex(/[A-Za-z]/, 'Password needs a letter').regex(/\d/, 'Password needs a number'),
  role: z.enum(['CREATOR', 'BRAND'], { errorMap: () => ({ message: 'role must be CREATOR or BRAND' }) }),
});
exports.login = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

const creator = {
  displayName: z.string().trim().min(2).max(100), bio: z.string().trim().max(1000),
  niche: z.string().trim().max(100), location: z.string().trim().max(100), avatarUrl: url,
};
exports.creatorCreate = z.object({ displayName: creator.displayName, bio: opt(creator.bio), niche: opt(creator.niche), location: opt(creator.location), avatarUrl: opt(creator.avatarUrl) });
exports.creatorUpdate = exports.creatorCreate.partial().refine(o => Object.keys(o).length, 'Provide at least one field');

const brand = {
  companyName: z.string().trim().min(2).max(150), industry: z.string().trim().max(100), website: url,
  description: z.string().trim().max(2000), location: z.string().trim().max(100), logoUrl: url,
};
exports.brandCreate = z.object({ companyName: brand.companyName, industry: opt(brand.industry), website: opt(brand.website), description: opt(brand.description), location: opt(brand.location), logoUrl: opt(brand.logoUrl) });
exports.brandUpdate = exports.brandCreate.partial().refine(o => Object.keys(o).length, 'Provide at least one field');

exports.socialCreate = z.object({
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'FACEBOOK', 'LINKEDIN', 'OTHER']),
  handle: z.string().trim().min(1).max(100), profileUrl: opt(url),
  followers: z.number().int().min(0).max(2000000000).optional(),
});
exports.socialUpdate = exports.socialCreate.partial().refine(o => Object.keys(o).length, 'Provide at least one field');
