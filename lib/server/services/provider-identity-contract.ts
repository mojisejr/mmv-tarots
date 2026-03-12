export const LINE_PROVIDER_ID = 'line' as const;

export type OAuthProviderId = typeof LINE_PROVIDER_ID | 'google';

export type ProviderIdentity = {
  providerId: OAuthProviderId;
  providerAccountId: string;
  displayName: string;
  avatar?: string;
  providerIdentityEmail: string;
};

export function buildProviderIdentityEmail(
  providerId: OAuthProviderId,
  providerAccountId: string,
  domain: string = 'mimivibe.com'
): string {
  return `${providerId}.${providerAccountId}@${domain}`;
}

export function isMessagingLinkedProvider(providerId: OAuthProviderId): boolean {
  return providerId === LINE_PROVIDER_ID;
}