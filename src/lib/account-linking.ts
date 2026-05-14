export const ACCOUNT_LINK_INTENT_COOKIE = "chihiro-account-link-intent";
export const ACCOUNT_LINK_INTENT_MAX_AGE_SECONDS = 60 * 5;

export function isSupportedAccountLinkProvider(provider: string) {
  return provider === "github" || provider === "google";
}

export function getProviderLabel(provider: string) {
  if (provider === "github") {
    return "GitHub";
  }

  if (provider === "google") {
    return "Google";
  }

  return provider;
}
