const { z } = require('zod');

const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['customer', 'provider', 'admin']).default('customer'),
    // Provider specific fields during registration (optional in body)
    category: z.string().optional(),
    experience: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(0, 'Experience must be 0 or more').optional()),
    bio: z.string().max(500).optional()
  }).refine(data => {
    if (data.role === 'provider') {
      return data.category !== undefined && data.experience !== undefined;
    }
    return true;
  }, {
    message: "Provider registration requires a Category and Experience",
    path: ["category"]
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

module.exports = {
  signupSchema,
  loginSchema
};
