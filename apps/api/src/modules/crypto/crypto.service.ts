import type {
  CryptoDetail,
  CryptoListItem,
  CryptoListResponse,
  ListCryptoSort,
  ListCryptoQuery,
  SupportedCurrency
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
  quotes?: Record<string, CoinPaprikaQuote | undefined>;
}

interface CoinPaprikaQuote {
  price?: number;
  market_cap?: number;
  volume_24h?: number;
  percent_change_1h?: number;
  percent_change_24h?: number;
  percent_change_7d?: number;
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
const DEFAULT_CURRENCY: SupportedCurrency = "USD";

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

function buildQuotesQuery(currency: SupportedCurrency): string {
  return `?quotes=${encodeURIComponent(currency)}`;
}

class CoinPaprikaService {
  private readonly baseUrl: string;
  private coinsCache: CacheEntry<CoinPaprikaCoin[]> | null = null;
  private coinsFlight: Promise<CoinPaprikaCoin[]> | null = null;
  private tickersCacheByCurrency = new Map<
    SupportedCurrency,
    CacheEntry<Map<string, CoinPaprikaTicker>>
  >();
  private tickersFlightByCurrency = new Map<
    SupportedCurrency,
    Promise<Map<string, CoinPaprikaTicker>>
  >();
  private coinsNegativeUntil = 0;
  private tickersNegativeUntilByCurrency = new Map<SupportedCurrency, number>();
  private detailCache = new Map<string, CacheEntry<CryptoDetail>>();
  private listSnapshotsByCurrency = new Map<SupportedCurrency, ListSnapshot>();
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

  private getTickerQuote(
    ticker: CoinPaprikaTicker | undefined,
    currency: SupportedCurrency
  ): CoinPaprikaQuote | undefined {
    if (!ticker?.quotes) {
      return undefined;
    }

    return ticker.quotes[currency] ?? ticker.quotes[DEFAULT_CURRENCY];
  }

  private getDetailCacheKey(coinId: string, currency: SupportedCurrency): string {
    return `${coinId}|${currency}`;
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

  private refreshTickersMap(currency: SupportedCurrency): Promise<Map<string, CoinPaprikaTicker>> {
    const flight = this.fetchJson<CoinPaprikaTicker[]>(`/tickers${buildQuotesQuery(currency)}`)
      .then((tickers) => {
        const map = new Map<string, CoinPaprikaTicker>();
        for (const ticker of tickers) {
          map.set(ticker.id, ticker);
        }
        this.tickersCacheByCurrency.set(currency, {
          value: map,
          expiresAt: Date.now() + TICKERS_TTL_MS
        });
        return map;
      })
      .catch((error) => {
        this.tickersNegativeUntilByCurrency.set(currency, Date.now() + NEGATIVE_CACHE_TTL_MS);
        throw error;
      })
      .finally(() => {
        this.tickersFlightByCurrency.delete(currency);
      });

    this.tickersFlightByCurrency.set(currency, flight);
    return flight;
  }

  private async getTickersMap(
    currency: SupportedCurrency
  ): Promise<Map<string, CoinPaprikaTicker>> {
    const now = Date.now();
    const cached = this.tickersCacheByCurrency.get(currency);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const inFlight = this.tickersFlightByCurrency.get(currency);

    if (cached) {
      if (!inFlight && (this.tickersNegativeUntilByCurrency.get(currency) ?? 0) <= now) {
        void this.refreshTickersMap(currency);
      }
      return cached.value;
    }

    if ((this.tickersNegativeUntilByCurrency.get(currency) ?? 0) > now) {
      throw new AppError("CoinPaprika request failed (back-off)", 502);
    }

    if (inFlight) {
      return inFlight;
    }

    return this.refreshTickersMap(currency);
  }

  private getListSnapshot(
    coins: CoinPaprikaCoin[],
    tickersMap: Map<string, CoinPaprikaTicker>,
    currency: SupportedCurrency
  ): ListSnapshot {
    const snapshot = this.listSnapshotsByCurrency.get(currency);
    if (snapshot && snapshot.coinsRef === coins && snapshot.tickersRef === tickersMap) {
      return snapshot;
    }

    const records = coins.map((coin) => ({
      coin,
      ticker: tickersMap.get(coin.id),
      nameLower: coin.name.toLowerCase(),
      symbolLower: coin.symbol.toLowerCase()
    }));

    const nextSnapshot: ListSnapshot = {
      coinsRef: coins,
      tickersRef: tickersMap,
      records,
      sortedBy: new Map<ListCryptoSort, CoinListRecord[]>()
    };

    this.listSnapshotsByCurrency.set(currency, nextSnapshot);
    return nextSnapshot;
  }

  private getSortedRecords(
    snapshot: ListSnapshot,
    sort: ListCryptoSort,
    currency: SupportedCurrency
  ): CoinListRecord[] {
    const cached = snapshot.sortedBy.get(sort);
    if (cached) {
      return cached;
    }

    const sorted = [...snapshot.records].sort((left, right) =>
      this.compareRecords(left, right, sort, currency)
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
    ticker: CoinPaprikaTicker | undefined,
    currency: SupportedCurrency
  ): CryptoListItem {
    const quote = this.getTickerQuote(ticker, currency);

    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      rank: Number.isFinite(coin.rank) ? coin.rank : null,
      type: coin.type,
      price: quote?.price,
      percentChange24h: quote?.percent_change_24h,
      logoUrl: createLogoUrl(coin.id)
    };
  }

  private compareRecords(
    left: CoinListRecord,
    right: CoinListRecord,
    sort: ListCryptoSort,
    currency: SupportedCurrency
  ): number {
    const leftCoin = left.coin;
    const rightCoin = right.coin;
    const leftQuote = this.getTickerQuote(left.ticker, currency);
    const rightQuote = this.getTickerQuote(right.ticker, currency);

    const byRank = compareNullableNumber(leftCoin.rank, rightCoin.rank, "asc");
    const byNameAsc =
      left.nameLower < right.nameLower ? -1 : left.nameLower > right.nameLower ? 1 : 0;

    switch (sort) {
      case "price_desc": {
        const byPrice = compareNullableNumber(leftQuote?.price, rightQuote?.price, "desc");
        return byPrice || byRank || byNameAsc;
      }
      case "price_asc": {
        const byPrice = compareNullableNumber(leftQuote?.price, rightQuote?.price, "asc");
        return byPrice || byRank || byNameAsc;
      }
      case "change24_desc": {
        const byChange = compareNullableNumber(
          leftQuote?.percent_change_24h,
          rightQuote?.percent_change_24h,
          "desc"
        );
        return byChange || byRank || byNameAsc;
      }
      case "change24_asc": {
        const byChange = compareNullableNumber(
          leftQuote?.percent_change_24h,
          rightQuote?.percent_change_24h,
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

  async warmup(currency: SupportedCurrency = DEFAULT_CURRENCY): Promise<void> {
    const [coins, tickersMap] = await Promise.all([this.getCoins(), this.getTickersMap(currency)]);
    const snapshot = this.getListSnapshot(coins, tickersMap, currency);
    this.getSortedRecords(snapshot, "price_desc", currency);
  }

  async list(
    queryInput: unknown,
    currency: SupportedCurrency = DEFAULT_CURRENCY
  ): Promise<CryptoListResponse> {
    const query: ListCryptoQuery = listCryptoQuerySchema.parse(queryInput);
    const [coins, tickersMap] = await Promise.all([this.getCoins(), this.getTickersMap(currency)]);
    const snapshot = this.getListSnapshot(coins, tickersMap, currency);
    const sortedRecords = this.getSortedRecords(snapshot, query.sort, currency);
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
      data: pageItems.map((record) => this.mapCoinToListItem(record.coin, record.ticker, currency)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total
      }
    };
  }

  async getById(
    coinId: string,
    currency: SupportedCurrency = DEFAULT_CURRENCY
  ): Promise<CryptoDetail> {
    const now = Date.now();
    const cacheKey = this.getDetailCacheKey(coinId, currency);
    const cached = this.detailCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const [coin, ticker] = await Promise.all([
      this.fetchJson<CoinPaprikaCoinDetails>(`/coins/${coinId}`),
      this.fetchJson<CoinPaprikaTicker>(`/tickers/${coinId}${buildQuotesQuery(currency)}`)
    ]);

    const quote = this.getTickerQuote(ticker, currency);
    const detail: CryptoDetail = {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      rank: Number.isFinite(coin.rank) ? coin.rank : null,
      type: coin.type,
      description: coin.description,
      price: quote?.price,
      percentChange1h: quote?.percent_change_1h,
      percentChange24h: quote?.percent_change_24h,
      percentChange7d: quote?.percent_change_7d,
      marketCap: quote?.market_cap,
      volume24h: quote?.volume_24h,
      circulatingSupply: coin.circulating_supply,
      maxSupply: coin.max_supply ?? undefined,
      logoUrl: createLogoUrl(coin.id)
    };

    this.detailCache.set(cacheKey, { value: detail, expiresAt: Date.now() + DETAIL_TTL_MS });
    return detail;
  }

  async getByIds(
    ids: string[],
    currency: SupportedCurrency = DEFAULT_CURRENCY
  ): Promise<CryptoListItem[]> {
    if (ids.length === 0) {
      return [];
    }

    const [coins, tickersMap] = await Promise.all([this.getCoins(), this.getTickersMap(currency)]);
    const coinById = this.getCoinByIdMap(coins);

    return ids
      .map((id) => {
        const coin = coinById.get(id);
        if (!coin) {
          return null;
        }

        return this.mapCoinToListItem(coin, tickersMap.get(id), currency);
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
