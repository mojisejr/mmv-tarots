const DEFAULT_SITE_URL = "https://www.maemormimi.com";

const ensureProtocol = (value: string): string => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
};

export const resolveSiteUrl = (value?: string): string => {
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  try {
    const normalized = ensureProtocol(value.trim());
    const parsed = new URL(normalized);

    return parsed.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
};

export const getSiteUrl = (): string =>
  resolveSiteUrl(process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL);

export const resolveAbsoluteUrl = (path: string, siteUrl: string = getSiteUrl()): string => {
  return new URL(path, siteUrl).toString();
};

export { DEFAULT_SITE_URL };