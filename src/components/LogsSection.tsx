import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface LogEntry {
  id: number;
  time: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
}

const levelConfig = {
  INFO: { color: 'text-cyan-400', bg: 'rgba(0,245,255,0.05)', prefix: '[INFO]' },
  SUCCESS: { color: 'text-green-400', bg: 'rgba(34,197,94,0.05)', prefix: '[OK]  ' },
  WARN: { color: 'text-yellow-400', bg: 'rgba(251,191,36,0.05)', prefix: '[WARN]' },
  ERROR: { color: 'text-red-400', bg: 'rgba(239,68,68,0.05)', prefix: '[ERR] ' },
  DEBUG: { color: 'text-gray-500', bg: 'transparent', prefix: '[DBG] ' },
};

const generateLog = (id: number): LogEntry => {
  const levels: LogEntry['level'][] = ['INFO', 'SUCCESS', 'SUCCESS', 'WARN', 'ERROR', 'DEBUG', 'INFO', 'SUCCESS'];
  const messages = {
    INFO: [
      'Инициализация пула потоков — 10 workers',
      'Загрузка конфигурации из config.json',
      'Подключение к прокси-серверу 192.168.1.1:8080',
      'Начало проверки блока #' + Math.ceil(Math.random() * 100),
    ],
    SUCCESS: [
      `user${Math.floor(Math.random() * 9999)}@gmail.com — VALID (Premium)`,
      `account${Math.floor(Math.random() * 999)} — VALID (2FA enabled)`,
      `login_${Math.floor(Math.random() * 999)} — AUTH OK`,
    ],
    WARN: [
      'Rate limit approaching — снижение скорости',
      'Прокси 10.0.0.5 медленный (>2s) — замена',
      'Повторная попытка для account_' + Math.floor(Math.random() * 999),
    ],
    ERROR: [
      'Connection timeout для 192.168.1.5:8080',
      'Неверный формат строки: "badformat"',
      'API вернул 429 Too Many Requests',
    ],
    DEBUG: [
      `HTTP 200 — ${Math.floor(Math.random() * 200 + 100)}ms`,
      `Socket connect ${Math.floor(Math.random() * 50 + 10)}ms`,
      'Cookie validated, session active',
    ],
  };
  const level = levels[Math.floor(Math.random() * levels.length)];
  const msgArr = messages[level];
  const now = new Date();
  return {
    id,
    time: now.toLocaleTimeString('ru-RU', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0'),
    level,
    message: msgArr[Math.floor(Math.random() * msgArr.length)],
    source: ['checker', 'proxy', 'auth', 'parser'][Math.floor(Math.random() * 4)],
  };
};

const initial: LogEntry[] = Array.from({ length: 18 }, (_, i) => generateLog(i));

export default function LogsSection() {
  const [logs, setLogs] = useState<LogEntry[]>(initial);
  const [filter, setFilter] = useState<'ALL' | LogEntry['level']>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [liveMode, setLiveMode] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(initial.length);

  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = generateLog(idRef.current++);
        const updated = [...prev, newLog].slice(-200);
        return updated;
      });
    }, 600 + Math.random() * 800);
    return () => clearInterval(interval);
  }, [liveMode]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filtered = logs.filter(l => {
    const matchFilter = filter === 'ALL' || l.level === filter;
    const matchSearch = !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.source.includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = logs.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-4 animate-fade-up h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Логи операций</h2>
          <p className="text-sm text-gray-500 mt-0.5">Детальный журнал всех операций</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiveMode(!liveMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              liveMode
                ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                : 'glass-card border border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${liveMode ? 'bg-red-400 animate-pulse' : 'bg-gray-600'}`} />
            {liveMode ? 'LIVE' : 'PAUSE'}
          </button>
          <button
            onClick={() => setLogs([])}
            className="glass-card border border-gray-700 text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg text-xs transition-all"
          >
            Очистить
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Icon name="Search" size={13} className="absolute left-3 top-2.5 text-gray-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск в логах..."
            className="w-full pl-8 pr-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 mono transition-colors"
          />
        </div>

        <div className="flex gap-1.5">
          {(['ALL', 'SUCCESS', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map(l => {
            const cfg = l === 'ALL' ? { color: 'text-gray-300' } : levelConfig[l];
            return (
              <button
                key={l}
                onClick={() => setFilter(l)}
                className={`px-3 py-1.5 rounded-lg text-[10px] mono font-semibold transition-all ${
                  filter === l ? `border ${cfg.color}` : 'border border-transparent text-gray-600 hover:text-gray-400'
                }`}
                style={filter === l && l !== 'ALL' ? { borderColor: 'currentColor', background: levelConfig[l].bg } : filter === l ? { borderColor: 'rgba(255,255,255,0.15)' } : {}}
              >
                {l} {l !== 'ALL' && counts[l] ? <span className="opacity-60">({counts[l]})</span> : ''}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-1.5 text-[10px] mono transition-colors ${autoScroll ? 'text-cyan-400' : 'text-gray-600'}`}
        >
          <Icon name="ArrowDown" size={11} />
          AUTO
        </button>
      </div>

      <div className="glass-card neon-border rounded-xl overflow-hidden flex-1 scan-line">
        <div className="h-[420px] overflow-y-auto p-2 space-y-0.5 font-mono">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600">
              <span className="text-xs">Нет записей</span>
            </div>
          ) : (
            filtered.map(log => {
              const cfg = levelConfig[log.level];
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-3 py-1.5 rounded-md hover:bg-white/3 transition-colors group"
                  style={{ background: cfg.bg }}
                >
                  <span className="text-[10px] text-gray-600 shrink-0 mt-0.5 w-24">{log.time}</span>
                  <span className={`text-[10px] font-bold shrink-0 w-14 ${cfg.color}`}>{cfg.prefix}</span>
                  <span className={`text-[10px] shrink-0 w-14 text-gray-600 group-hover:text-gray-400 transition-colors`}>[{log.source}]</span>
                  <span className="text-[10px] text-gray-300 break-all">{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="mono text-[10px] text-gray-600">{filtered.length} строк {search && `(поиск: "${search}")`}</span>
        <button className="mono text-[10px] text-gray-600 hover:text-cyan-400 transition-colors flex items-center gap-1">
          <Icon name="Download" size={10} />
          Сохранить лог
        </button>
      </div>
    </div>
  );
}
