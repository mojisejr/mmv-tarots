export const SESSION_SHELL_TARGET_STORAGE_KEY = 'mmv_target';

export function buildLiffGatewayPath(currentPathname: string, currentSearch: string): string {
  const pathname = currentPathname || '/';
  const search = currentSearch || '';
  const state = `${pathname}${search}`;
  const params = new URLSearchParams();
  params.set('mmv_next', state);
  return `/liff?${params.toString()}`;
}
