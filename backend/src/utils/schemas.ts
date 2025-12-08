import { z } from 'zod';

export const jobCreateSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  areaId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive(),
  institutionId: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
  email: z.string().email("Email inválido"),
  telephone: z.string().min(8, "Telefone inválido"),
  companyName: z.string().optional().nullable(),
});

export const jobEditSchema = jobCreateSchema.partial();
