export type ShareActionId = 'copy-link' | 'copy-message' | 'copy-code';

export function resolveShareActionOrder(isLiff: boolean, hasReferralCode: boolean): ShareActionId[] {
  const base: ShareActionId[] = isLiff
    ? ['copy-code', 'copy-message', 'copy-link']
    : ['copy-link', 'copy-message', 'copy-code'];

  if (!hasReferralCode) {
    return base.filter((action) => action !== 'copy-code');
  }

  return base;
}
