export const PROXY_STORAGE_KEY = 'checker_proxy_config';

export interface ProxyConfig {
  enabled: boolean;
  list: string[];
  type: string;
  rotation: string;
}

export function getProxyConfig(): ProxyConfig {
  try {
    const raw = localStorage.getItem(PROXY_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProxyConfig;
  } catch (e) {
    console.warn('proxy config read error', e);
  }
  return { enabled: false, list: [], type: 'https', rotation: 'each' };
}

export function saveProxyConfig(cfg: ProxyConfig): void {
  localStorage.setItem(PROXY_STORAGE_KEY, JSON.stringify(cfg));
}
