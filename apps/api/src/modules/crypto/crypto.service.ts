import type {
  CryptoDetail,
  CryptoListItem,
  CryptoListResponse,
  ListCryptoQuery
} from "@crypto/shared";
import { listCryptoQuerySchema } from "@crypto/shared";

import { AppError } from "../../lib/app-error.js";

interface CoinPaprikaCoin {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  type: "coin" | "token";
}

interface CoinPaprikaTicker {
  id: string;
  rank: number;
  quotes?: {
    USD?: {
      price?: number;
      market_cap?: number;
      volume_24h?: number;
      percent_change_1h?: number;
      percent_change_24h?: number;
      percent_change_7d?: number;
    };
  };
}

interface CoinPaprikaCoinDetails {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  type: "coin" | "token";
  description?: string;
  circulating_supply?: number;
  max_supply?: number;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const COINS_TTL_MS = 5 * 60 * 1000;
const TICKERS_TTL_MS = 2 * 60 * 1000;

function createLogoUrl(coinId: string): string {
  return `https://static.coinpaprika.com/coin/${coinId}/logo.png`;
}

class CoinPaprikaService {
  private readonly baseUrl: string;
  private coinsCache: CacheEntry<CoinPaprikaCoin[]> | null = null;
  private tickersCache: CacheEntry<Map<string, CoinPaprikaTicker>> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new AppError("Criptomoeda nao encontrada", 404);
      }

      throw new AppError(`Falha ao consumir CoinPaprika (${response.status})`, 502);
    }

    return (await response.json()) as T;
  }

  private async getCoins(): Promise<CoinPaprikaCoin[]> {
    const now = Date.now();
    if (this.coinsCache && this.coinsCache.expiresAt > now) {
      return this.coinsCache.value;
    }

    const coins = await this.fetchJson<CoinPaprikaCoin[]>("/coins");
    this.coinsCache = {
      value: coins,
      expiresAt: now + COINS_TTL_MS
    };

    return coins;
  }

  private async getTickersMap(): Promise<Map<string, CoinPaprikaTicker>> {
    const now = Date.now();
    if (this.tickersCache && this.tickersCache.expiresAt > now) {
      return this.tickersCache.value;
    }

    const tickers = await this.fetchJson<CoinPaprikaTicker[]>("/tickers");
    const map = new Map<string, CoinPaprikaTicker>();
    for (const ticker of tickers) {
      map.set(ticker.id, ticker);
    }

    this.tickersCache = {
      value: map,
      expiresAt: now + TICKERS_TTL_MS
    };

    return map;
  }

  private mapCoinToListItem(coin: CoinPaprikaCoin, ticker: CoinPaprikaTicker | undefined): CryptoListItem {
    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      rank: Number.isFinite(coin.rank) ? coin.rank : null,
      type: coin.type,
      price: ticker?.quotes?.USD?.price,
      percentChange24h: ticker?.quotes?.USD?.percent_change_24h,
      logoUrl: createLogoUrl(coin.id)
    };
  }

  async list(queryInput: unknown): Promise<CryptoListResponse> {
    const query: ListCryptoQuery = listCryptoQuerySchema.parse(queryInput);
    const [coins, tickersMap] = await Promise.all([this.getCoins(), this.getTickersMap()]);

    const searchLower = query.search?.toLowerCase();
    const filtered = coins.filter((coin) => {
      if (query.type && coin.type !== query.type) {
        return false;
      }

      if (!searchLower) {
        return true;
      }

      return (
        coin.name.toLowerCase().includes(searchLower) || coin.symbol.toLowerCase().includes(searchLower)
      );
    });

    const total = filtered.length;
    const offset = (query.page - 1) * query.limit;
    const pageItems = filtered.slice(offset, offset + query.limit);

    return {
      data: pageItems.map((coin) => this.mapCoinToListItem(coin, tickersMap.get(coin.id))),
      pagination: {
        page: query.page,
        limit: query.limit,
        total
      }
    };
  }

  async getById(coinId: string): Promise<CryptoDetail> {
    const [coin, ticker] = await Promise.all([
      this.fetchJson<CoinPaprikaCoinDetails>(`/coins/${coinId}`),
      this.fetchJson<CoinPaprikaTicker>(`/tickers/${coinId}`)
    ]);

    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      rank: Number.isFinite(coin.rank) ? coin.rank : null,
      type: coin.type,
      description: coin.description,
      price: ticker?.quotes?.USD?.price,
      percentChange1h: ticker?.quotes?.USD?.percent_change_1h,
      percentChange24h: ticker?.quotes?.USD?.percent_change_24h,
      percentChange7d: ticker?.quotes?.USD?.percent_change_7d,
      marketCap: ticker?.quotes?.USD?.market_cap,
      volume24h: ticker?.quotes?.USD?.volume_24h,
      circulatingSupply: coin.circulating_supply,
      maxSupply: coin.max_supply ?? undefined,
      logoUrl: createLogoUrl(coin.id)
    };
  }

  async getByIds(ids: string[]): Promise<CryptoListItem[]> {
    if (ids.length === 0) {
      return [];
    }

    const [coins, tickersMap] = await Promise.all([this.getCoins(), this.getTickersMap()]);
    const coinById = new Map(coins.map((coin) => [coin.id, coin]));

    return ids
      .map((id) => {
        const coin = coinById.get(id);
        if (!coin) {
          return null;
        }

        return this.mapCoinToListItem(coin, tickersMap.get(id));
      })
      .filter((item): item is CryptoListItem => item !== null);
  }

  async hasCoinId(coinId: string): Promise<boolean> {
    const normalized = coinId.trim();
    if (!normalized) {
      return false;
    }

    const coins = await this.getCoins();
    return coins.some((coin) => coin.id === normalized);
  }
}

const servicesByBaseUrl = new Map<string, CoinPaprikaService>();

export function getCoinPaprikaService(baseUrl: string): CoinPaprikaService {
  const existing = servicesByBaseUrl.get(baseUrl);
  if (existing) {
    return existing;
  }

  const created = new CoinPaprikaService(baseUrl);
  servicesByBaseUrl.set(baseUrl, created);
  return created;
}
