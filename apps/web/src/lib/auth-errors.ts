interface Translator {
  (key: string): string;
}

const AUTH_ERROR_TRANSLATIONS: Array<{ match: RegExp; key: string }> = [
  { match: /invalid credentials/i, key: "auth.invalidCredentials" },
  { match: /email already registered/i, key: "auth.emailAlreadyRegistered" },
  { match: /invalid or expired reset token/i, key: "auth.invalidOrExpiredResetToken" }
];

export function getLocalizedAuthErrorMessage(
  error: unknown,
  t: Translator,
  fallbackKey: string
): string {
  if (!(error instanceof Error)) {
    return t("common.unexpectedError");
  }

  const match = AUTH_ERROR_TRANSLATIONS.find(({ match: pattern }) => pattern.test(error.message));
  if (match) {
    return t(match.key);
  }

  return t(fallbackKey);
}
