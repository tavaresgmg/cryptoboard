import type {
  CryptoDetail,
  CryptoListItem,
  CryptoListResponse,
  ListCryptoSort,
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

interface CoinListRecord {
  coin: CoinPaprikaCoin;
  ticker: CoinPaprikaTicker | undefined;
  nameLower: string;
  symbolLower: string;
}

interface ListSnapshot {
  coinsRef: CoinPaprikaCoin[];
  tickersRef: Map<string, CoinPaprikaTicker>;
  records: CoinListRecord[];
  sortedBy: Map<ListCryptoSort, CoinListRecord[]>;
}

interface CoinByIdSnapshot {
  coinsRef: CoinPaprikaCoin[];
  value: Map<string, CoinPaprikaCoin>;
}

const COINS_TTL_MS = 5 * 60 * 1000;
const TICKERS_TTL_MS = 2 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 10 * 1000;
const DETAIL_TTL_MS = 60 * 1000;

function createLogoUrl(coinId: string): string {
  return `https://static.coinpaprika.com/coin/${coinId}/logo.png`;
}

function sanitizeNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function compareNullableNumber(
  left: number | null | undefined,
  right: number | null | undefined,
  direction: "asc" | "desc"
): number {
  const a = sanitizeNumber(left);
  const b = sanitizeNumber(right);

  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return direction === "asc" ? a - b : b - a;
}

class CoinPaprikaService {
  private readonly baseUrl: string;
  private coinsCache: CacheEntry<CoinPaprikaCoin[]> | null = null;
  private tickersCache: CacheEntry<Map<string, CoinPaprikaTicker>> | null = null;
  private coinsFlight: Promise<CoinPaprikaCoin[]> | null = null;
  private tickersFlight: Promise<Map<string, CoinPaprikaTicker>> | null = null;
  private coinsNegativeUntil = 0;
  private tickersNegativeUntil = 0;
  private detailCache = new Map<string, CacheEntry<CryptoDetail>>();
  private listSnapshot: ListSnapshot | null = null;
  private coinByIdSnapshot: CoinByIdSnapshot | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new AppError("Cryptocurrency not found", 404);
      }

      throw new AppError(`CoinPaprika request failed (${response.status})`, 502);
    }

    return (await response.json()) as T;
  }

  private refreshCoins(): Promise<CoinPaprikaCoin[]> {
    this.coinsFlight = this.fetchJson<CoinPaprikaCoin[]>("/coins")
      .then((coins) => {
        this.coinsCache = { value: coins, expiresAt: Date.now() + COINS_TTL_MS };
        return coins;
      })
      .catch((error) => {
        this.coinsNegativeUntil = Date.now() + NEGATIVE_CACHE_TTL_MS;
        throw error;
      })
      .finally(() => {
        this.coinsFlight = null;
      });

    return this.coinsFlight;
  }

  private async getCoins(): Promise<CoinPaprikaCoin[]> {
    const now = Date.now();
    if (this.coinsCache && this.coinsCache.expiresAt > now) {
      return this.coinsCache.value;
    }

    if (this.coinsCache) {
      if (!this.coinsFlight && this.coinsNegativeUntil <= now) {
        void this.refreshCoins();
      }
      return this.coinsCache.value;
    }

    if (this.coinsNegativeUntil > now) {
      throw new AppError("CoinPaprika request failed (back-off)", 502);
    }

    if (this.coinsFlight) {
      return this.coinsFlight;
    }

    return this.refreshCoins();
  }

  private refreshTickersMap(): Promise<Map<string, CoinPaprikaTicker>> {
    this.tickersFlight = this.fetchJson<CoinPaprikaTicker[]>("/tickers")
      .then((tickers) => {
        const map = new Map<string, CoinPaprikaTicker>();
        for (const ticker of tickers) {
          map.set(ticker.id, ticker);
        }
        this.tickersCache = { value: map, expiresAt: Date.now() + TICKERS_TTL_MS };
        return map;
      })
      .catch((error) => {
        this.tickersNegativeUntil = Date.now() + NEGATIVE_CACHE_TTL_MS;
        throw error;
      })
      .finally(() => {
        this.tickersFlight = null;
      });

    return this.tickersFlight;
  }

  private async getTickersMap(): Promise<Map<string, CoinPaprikaTicker>> {
    const now = Date.now();
    if (this.tickersCache && this.tickersCache.expiresAt > now) {
      return this.tickersCache.value;
    }

    if (this.tickersCache) {
      if (!this.tickersFlight && this.tickersNegativeUntil <= now) {
        void this.refreshTickersMap();
      }
      return this.tickersCache.value;
    }

    if (this.tickersNegativeUntil > now) {
      throw new AppError("CoinPaprika request failed (back-off)", 502);
    }

    if (this.tickersFlight) {
      return this.tickersFlight;
    }

    return this.refreshTickersMap();
  }

  private getListSnapshot(
    coins: CoinPaprikaCoin[],
    tickersMap: Map<string, CoinPaprikaTicker>
  ): ListSnapshot {
    if (
      this.listSnapshot &&
      this.listSnapshot.coinsRef === coins &&
      this.listSnapshot.tickersRef === tickersMap
    ) {
      return this.listSnapshot;
    }

    const records = coins.map((coin) => ({
      coin,
      ticker: tickersMap.get(coin.id),
      nameLower: coin.name.toLowerCase(),
      symbolLower: coin.symbol.toLowerCase()
    }));

    this.listSnapshot = {
      coinsRef: coins,
      tickersRef: tickersMap,
      records,
      sortedBy: new Map<ListCryptoSort, CoinListRecord[]>()
    };

    return this.listSnapshot;
  }

  private getSortedRecords(snapshot: ListSnapshot, sort: ListCryptoSort): CoinListRecord[] {
    const cached = snapshot.sortedBy.get(sort);
    if (cached) {
      return cached;
    }

    const sorted = [...snapshot.records].sort((left, right) =>
      this.compareRecords(left, right, sort)
    );
    snapshot.sortedBy.set(sort, sorted);
    return sorted;
  }

  private getCoinByIdMap(coins: CoinPaprikaCoin[]): Map<string, CoinPaprikaCoin> {
    if (this.coinByIdSnapshot && this.coinByIdSnapshot.coinsRef === coins) {
      return this.coinByIdSnapshot.value;
    }

    const value = new Map(coins.map((coin) => [coin.id, coin]));
    this.coinByIdSnapshot = {
      coinsRef: coins,
      value
    };
    return value;
  }

  private mapCoinToListItem(
    coin: CoinPaprikaCoin,
    ticker: CoinPaprikaTicker | undefined
  ): CryptoListItem {
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

  private compareRecords(
    left: CoinListRecord,
    right: CoinListRecord,
    sort: ListCryptoSort
  ): number {
    const leftCoin = left.coin;
    const rightCoin = right.coin;
    const leftTicker = left.ticker;
    const rightTicker = right.ticker;

    const byRank = compareNullableNumber(leftCoin.rank, rightCoin.rank, "asc");
    const byNameAsc =
      left.nameLower < right.nameLower ? -1 : left.nameLower > right.nameLower ? 1 : 0;

    switch (sort) {
      case "price_desc": {
        const byPrice = compareNullableNumber(
          leftTicker?.quotes?.USD?.price,
          rightTicker?.quotes?.USD?.price,
          "desc"
        );
        return byPrice || byRank || byNameAsc;
      }
      case "price_asc": {
        const byPrice = compareNullableNumber(
          leftTicker?.quotes?.USD?.price,
          rightTicker?.quotes?.USD?.price,
          "asc"
        );
        return byPrice || byRank || byNameAsc;
      }
      case "change24_desc": {
        const byChange = compareNullableNumber(
          leftTicker?.quotes?.USD?.percent_change_24h,
          rightTicker?.quotes?.USD?.percent_change_24h,
          "desc"
        );
        return byChange || byRank || byNameAsc;
      }
      case "change24_asc": {
        const byChange = compareNullableNumber(
          leftTicker?.quotes?.USD?.percent_change_24h,
          rightTicker?.quotes?.USD?.percent_change_24h,
          "asc"
        );
        return byChange || byRank || byNameAsc;
      }
      case "name_asc":
        return byNameAsc || byRank;
      case "name_desc":
        return -byNameAsc || byRank;
      case "rank_asc":
      default:
        return byRank || byNameAsc;
    }
  }

  async warmup(): Promise<void> {
    const [coins, tickersMap] = await Promise.all([this.getCoins(), this.getTickersMap()]);
    const snapshot = this.getListSnapshot(coins, tickersMap);
    this.getSortedRecords(snapshot, "price_desc");
  }

  async list(queryInput: unknown): Promise<CryptoListResponse> {
    const query: ListCryptoQuery = listCryptoQuerySchema.parse(queryInput);
    const [coins, tickersMap] = await Promise.all([this.getCoins(), this.getTickersMap()]);
    const snapshot = this.getListSnapshot(coins, tickersMap);
    const sortedRecords = this.getSortedRecords(snapshot, query.sort);
    const searchLower = query.search?.toLowerCase();
    const filteredRecords = sortedRecords.filter((record) => {
      if (query.type && record.coin.type !== query.type) {
        return false;
      }

      if (!searchLower) {
        return true;
      }

      return record.nameLower.includes(searchLower) || record.symbolLower.includes(searchLower);
    });

    const total = filteredRecords.length;
    const offset = (query.page - 1) * query.limit;
    const pageItems = filteredRecords.slice(offset, offset + query.limit);

    return {
      data: pageItems.map((record) => this.mapCoinToListItem(record.coin, record.ticker)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total
      }
    };
  }

  async getById(coinId: string): Promise<CryptoDetail> {
    const now = Date.now();
    const cached = this.detailCache.get(coinId);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const [coin, ticker] = await Promise.all([
      this.fetchJson<CoinPaprikaCoinDetails>(`/coins/${coinId}`),
      this.fetchJson<CoinPaprikaTicker>(`/tickers/${coinId}`)
    ]);

    const detail: CryptoDetail = {
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

    this.detailCache.set(coinId, { value: detail, expiresAt: Date.now() + DETAIL_TTL_MS });
    return detail;
  }

  async getByIds(ids: string[]): Promise<CryptoListItem[]> {
    if (ids.length === 0) {
      return [];
    }

    const [coins, tickersMap] = await Promise.all([this.getCoins(), this.getTickersMap()]);
    const coinById = this.getCoinByIdMap(coins);

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
    const coinById = this.getCoinByIdMap(coins);
    return coinById.has(normalized);
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
