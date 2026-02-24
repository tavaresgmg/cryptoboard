export const APP_NAME = "CryptoBoard";

export const SUPPORTED_LANGUAGES = ["es", "en", "pt-BR"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "BRL", "GBP"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export * from "./schemas/index.js";
