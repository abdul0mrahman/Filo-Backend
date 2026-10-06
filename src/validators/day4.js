const { z } = require('zod');
const campaignBase = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(2000).optional(),
  budget: z.number().int().min(0).max(1000000000).optional(),
  deadline: z.coerce.date({ invalid_type_error: 'deadline must be a valid date' }).optional(),
});
exports.campaignCreate = campaignBase;
exports.campaignUpdate = campaignBase.partial().extend({ status: z.enum(['ACTIVE', 'CLOSED']).optional() })
  .refine((o) => Object.keys(o).length, 'Provide at least one field');
exports.invitationCreate = z.object({
  campaignId: z.number().int().positive(),
  creatorId: z.number().int().positive(),
  message: z.string().trim().max(1000).optional(),
});
exports.invitationRespond = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED'], { errorMap: () => ({ message: 'status must be ACCEPTED or REJECTED' }) }),
});
