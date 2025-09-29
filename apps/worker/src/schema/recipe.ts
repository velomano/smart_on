import { z } from "zod";
export const RecipeSchema = z.object({
  crop_key: z.string().min(1),
  crop_name: z.string().optional(),
  stage: z.enum(["seedling","vegetative","flowering","fruiting","ripening"]),
  target_ec: z.number().min(0).max(10).optional(),
  target_ph: z.number().min(4.5).max(7.5).optional(),
  macro: z.object({ N:z.number(), P:z.number(), K:z.number(), Ca:z.number(), Mg:z.number(), S:z.number() }),
  micro: z.object({ Fe:z.number(), Mn:z.number(), B:z.number(), Zn:z.number(), Cu:z.number(), Mo:z.number() }),
  ions: z.record(z.number()).optional(),
  env: z.record(z.number()).optional(),
  source: z.object({
    name:z.string(),
    url:z.string().url().optional(),
    org_type:z.enum(["government","academic","commercial","community"]),
    license:z.string().optional(),
    reliability_default:z.number().min(0).max(1).optional()
  }).optional(),
  checksum: z.string().min(10)
});
