import { z } from "zod";

export const cryptoTypeSchema = z.enum(["coin", "token"]);
export const listCryptoSortSchema = z.enum([
  "rank_asc",
  "price_desc",
  "price_asc",
  "change24_desc",
  "change24_asc",
  "name_asc",
  "name_desc"
]);

export const listCryptoQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  type: cryptoTypeSchema.optional(),
  sort: listCryptoSortSchema.default("price_desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListCryptoQuery = z.infer<typeof listCryptoQuerySchema>;
export type ListCryptoSort = z.infer<typeof listCryptoSortSchema>;

export const cryptoListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  rank: z.number().int().nonnegative().nullable(),
  type: cryptoTypeSchema,
  price: z.number().nonnegative().optional(),
  percentChange24h: z.number().optional(),
  logoUrl: z.url().optional()
});

export type CryptoListItem = z.infer<typeof cryptoListItemSchema>;

export const cryptoListResponseSchema = z.object({
  data: z.array(cryptoListItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0)
  })
});

export type CryptoListResponse = z.infer<typeof cryptoListResponseSchema>;

export const cryptoDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  rank: z.number().int().nonnegative().nullable(),
  type: cryptoTypeSchema,
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  percentChange1h: z.number().optional(),
  percentChange24h: z.number().optional(),
  percentChange7d: z.number().optional(),
  marketCap: z.number().optional(),
  volume24h: z.number().optional(),
  circulatingSupply: z.number().optional(),
  maxSupply: z.number().optional(),
  logoUrl: z.url().optional()
});

export type CryptoDetail = z.infer<typeof cryptoDetailSchema>;

export const favoritesResponseSchema = z.object({
  favorites: z.array(z.string())
});

export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>;

export const favoriteListResponseSchema = z.object({
  data: z.array(cryptoListItemSchema)
});

export type FavoriteListResponse = z.infer<typeof favoriteListResponseSchema>;
