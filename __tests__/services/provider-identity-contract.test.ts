import { describe, expect, it } from 'vitest';
import {
  buildProviderIdentityEmail,
  isMessagingLinkedProvider,
  LINE_PROVIDER_ID,
} from '@/lib/server/services/provider-identity-contract';

describe('provider-identity-contract', () => {
  it('builds deterministic provider identity email', () => {
    expect(buildProviderIdentityEmail('line', 'abc123')).toBe('line.abc123@mimivibe.com');
    expect(buildProviderIdentityEmail('google', 'sub-001')).toBe('google.sub-001@mimivibe.com');
  });

  it('flags messaging-linked provider capability', () => {
    expect(isMessagingLinkedProvider(LINE_PROVIDER_ID)).toBe(true);
    expect(isMessagingLinkedProvider('google')).toBe(false);
  });
});
