import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Account {
  id: number;
  value: string;
  status: 'pending' | 'checking' | 'valid' | 'invalid' | 'error';
  details?: string;
  checkedAt?: string;
}

const mockCheck = (account: string): Promise<{ valid: boolean; details: string }> => {
  return new Promise((resolve) => {
    const delay = 300 + Math.random() * 1200;
    setTimeout(() => {
      const valid = Math.random() > 0.35;
      resolve({
        valid,
        details: valid ? 'Активен · Premium · 2FA включён' : 'Неверный пароль или аккаунт заблокирован',
      });
    }, delay);
  });
};

export default function CheckerSection() {
  const [rawInput, setRawInput] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [threads, setThreads] = useState(10);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ valid: 0, invalid: 0, errors: 0, total: 0 });
  const stopRef = useRef(false);

  const parseAccounts = (text: string): string[] => {
    return text.split('\n').map(l => l.trim()).filter(Boolean);
  };

  const runCheck = async () => {
    const lines = parseAccounts(rawInput);
    if (!lines.length) return;
    stopRef.current = false;
    setIsRunning(true);
    setProgress(0);
    setStats({ valid: 0, invalid: 0, errors: 0, total: lines.length });

    const initialAccounts: Account[] = lines.map((v, i) => ({
      id: i,
      value: v,
      status: 'pending',
    }));
    setAccounts(initialAccounts);

    let done = 0;
    let validCount = 0;
    let invalidCount = 0;
    let errorCount = 0;

    const processAccount = async (index: number) => {
      if (stopRef.current) return;
      setAccounts(prev =>
        prev.map(a => a.id === index ? { ...a, status: 'checking' } : a)
      );
      try {
        const result = await mockCheck(lines[index]);
        if (stopRef.current) return;
        const status = result.valid ? 'valid' : 'invalid';
        if (result.valid) validCount++; else invalidCount++;
        done++;
        setAccounts(prev =>
          prev.map(a => a.id === index ? {
            ...a,
            status,
            details: result.details,
            checkedAt: new Date().toLocaleTimeString('ru-RU'),
          } : a)
        );
      } catch {
        errorCount++;
        done++;
        setAccounts(prev =>
          prev.map(a => a.id === index ? { ...a, status: 'error', details: 'Ошибка соединения' } : a)
        );
      }
      setProgress(Math.round((done / lines.length) * 100));
      setStats({ valid: validCount, invalid: invalidCount, errors: errorCount, total: lines.length });
    };

    const chunks: number[][] = [];
    for (let i = 0; i < lines.length; i += threads) {
      chunks.push(Array.from({ length: Math.min(threads, lines.length - i) }, (_, k) => i + k));
    }

    for (const chunk of chunks) {
      if (stopRef.current) break;
      await Promise.all(chunk.map(i => processAccount(i)));
    }

    setIsRunning(false);
  };

  const stopCheck = () => {
    stopRef.current = true;
    setIsRunning(false);
  };

  const clearAll = () => {
    setAccounts([]);
    setRawInput('');
    setProgress(0);
    setStats({ valid: 0, invalid: 0, errors: 0, total: 0 });
  };

  const statusIcon = (s: Account['status']) => {
    if (s === 'valid') return <span className="status-valid mono text-xs font-semibold">✓ VALID</span>;
    if (s === 'invalid') return <span className="status-invalid mono text-xs font-semibold">✗ INVALID</span>;
    if (s === 'checking') return <span className="status-checking mono text-xs font-semibold">⟳ CHECK...</span>;
    if (s === 'error') return <span className="mono text-xs font-semibold text-yellow-400">! ERROR</span>;
    return <span className="mono text-xs text-gray-500">— PENDING</span>;
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Проверка аккаунтов</h2>
          <p className="text-sm text-gray-500 mt-0.5">Загрузите список и запустите параллельную проверку</p>
        </div>
        <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-orange-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className="mono text-xs text-gray-400">{isRunning ? 'RUNNING' : 'IDLE'}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Всего', value: stats.total, color: 'text-gray-300', bg: 'rgba(255,255,255,0.03)' },
          { label: 'Валидных', value: stats.valid, color: 'status-valid', bg: 'rgba(34,197,94,0.05)' },
          { label: 'Невалидных', value: stats.invalid, color: 'status-invalid', bg: 'rgba(239,68,68,0.05)' },
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
            placeholder={"login:password\nuser@mail.com:pass123\nlogin2:pass456"}
            className="mono text-xs bg-transparent border border-gray-700 rounded-lg p-3 text-gray-300 placeholder-gray-600 resize-none h-52 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500">Потоков:</label>
            <input
              type="range"
              min={1}
              max={50}
              value={threads}
              onChange={e => setThreads(Number(e.target.value))}
              className="flex-1 accent-cyan-400"
            />
            <span className="mono text-sm text-cyan-400 w-6 text-right">{threads}</span>
          </div>
        </div>

        <div className="glass-card neon-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">Результаты</span>
            {progress > 0 && (
              <span className="mono text-xs text-cyan-400">{progress}%</span>
            )}
          </div>

          {progress > 0 && (
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full progress-bar-glow rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto h-48 space-y-1 pr-1">
            {accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <Icon name="ScanLine" size={32} />
                <span className="text-xs mt-2">Результаты появятся здесь</span>
              </div>
            ) : (
              accounts.map(acc => (
                <div
                  key={acc.id}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
                    acc.status === 'checking' ? 'bg-orange-500/8 border border-orange-500/20' :
                    acc.status === 'valid' ? 'bg-green-500/5 border border-green-500/10' :
                    acc.status === 'invalid' ? 'bg-red-500/5 border border-red-500/10' :
                    'border border-transparent'
                  }`}
                >
                  <span className="mono text-xs text-gray-400 truncate max-w-[180px]">{acc.value}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {acc.checkedAt && <span className="mono text-[10px] text-gray-600">{acc.checkedAt}</span>}
                    {statusIcon(acc.status)}
                  </div>
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
            disabled={!rawInput.trim()}
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
      </div>
    </div>
  );
}
