import { z } from "zod";

export const cryptoTypeSchema = z.enum(["coin", "token"]);

export const listCryptoQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  type: cryptoTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListCryptoQuery = z.infer<typeof listCryptoQuerySchema>;

export const cryptoListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  rank: z.number().int().nonnegative().nullable(),
  type: cryptoTypeSchema,
  price: z.number().nonnegative().optional(),
  percentChange24h: z.number().optional()
});

export type CryptoListItem = z.infer<typeof cryptoListItemSchema>;
