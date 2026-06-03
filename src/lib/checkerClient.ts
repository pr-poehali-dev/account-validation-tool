const API_URL = 'https://functions.poehali.dev/89956202-dc65-4543-8725-c4a0ad815187';

export interface CheckPayload {
  accounts: string[];
  threads: number;
  proxies?: string[];
  proxy_type?: string;
  proxy_rotation?: string;
}

export interface AccountCheckResult {
  login: string;
  status: 'valid' | 'invalid' | 'error';
  error?: string;
  raw_balance?: string | null;
  raw_equity?: string | null;
  accounts?: { account_number?: string; balance?: string; equity?: string; currency?: string }[];
}

interface DesktopChecker {
  isDesktop: boolean;
  checkBatch: (payload: CheckPayload) => Promise<{ results?: AccountCheckResult[] }>;
}

declare global {
  interface Window {
    desktopChecker?: DesktopChecker;
  }
}

export const isDesktopApp = (): boolean =>
  typeof window !== 'undefined' && !!window.desktopChecker?.isDesktop;

export async function runBatch(payload: CheckPayload): Promise<{ results?: AccountCheckResult[] }> {
  if (isDesktopApp() && window.desktopChecker) {
    return await window.desktopChecker.checkBatch(payload);
  }
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await resp.json();
}