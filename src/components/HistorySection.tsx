import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface CheckSession {
  id: string;
  date: string;
  time: string;
  total: number;
  valid: number;
  invalid: number;
  errors: number;
  source: string;
  duration: string;
}

const mockHistory: CheckSession[] = [
  { id: '1', date: '22.05.2026', time: '14:32', total: 1250, valid: 487, invalid: 718, errors: 45, source: 'accounts_may.txt', duration: '4m 12s' },
  { id: '2', date: '22.05.2026', time: '11:05', total: 500, valid: 201, invalid: 289, errors: 10, source: 'test_batch.csv', duration: '1m 58s' },
  { id: '3', date: '21.05.2026', time: '19:44', total: 3000, valid: 1102, invalid: 1820, errors: 78, source: 'big_list.txt', duration: '9m 37s' },
  { id: '4', date: '21.05.2026', time: '10:20', total: 800, valid: 312, invalid: 468, errors: 20, source: 'clients_db.txt', duration: '2m 44s' },
  { id: '5', date: '20.05.2026', time: '23:11', total: 150, valid: 89, invalid: 58, errors: 3, source: 'quick_check.txt', duration: '0m 32s' },
];

export default function HistorySection() {
  const [selected, setSelected] = useState<string | null>(null);

  const sel = mockHistory.find(h => h.id === selected);

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-bold text-white">История проверок</h2>
        <p className="text-sm text-gray-500 mt-0.5">Все предыдущие сессии и их результаты</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="neon-border rounded-xl p-4" style={{ background: 'rgba(0,245,255,0.04)' }}>
          <div className="text-2xl font-bold neon-text mono">5</div>
          <div className="text-xs text-gray-500 mt-1">Сессий за неделю</div>
        </div>
        <div className="neon-border rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.04)' }}>
          <div className="text-2xl font-bold mono status-valid">2 191</div>
          <div className="text-xs text-gray-500 mt-1">Всего валидных</div>
        </div>
        <div className="neon-border rounded-xl p-4" style={{ background: 'rgba(168,85,247,0.04)' }}>
          <div className="text-2xl font-bold mono text-purple-400">5 700</div>
          <div className="text-xs text-gray-500 mt-1">Всего проверено</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 glass-card neon-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">Сессии</span>
            <button className="text-xs text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Icon name="Download" size={12} />
              Экспорт всех
            </button>
          </div>
          <div className="divide-y divide-gray-800/60">
            {mockHistory.map(h => (
              <button
                key={h.id}
                onClick={() => setSelected(h.id === selected ? null : h.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all ${
                  selected === h.id ? 'bg-cyan-500/8 border-l-2 border-cyan-500' : 'hover:bg-white/3 border-l-2 border-transparent'
                }`}
              >
                <div className="shrink-0">
                  <div className="text-xs font-semibold text-gray-300">{h.date}</div>
                  <div className="mono text-[10px] text-gray-500">{h.time}</div>
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs text-gray-400 truncate">{h.source}</div>
                  <div className="mono text-[10px] text-gray-600">{h.duration}</div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <span className="mono text-xs status-valid">{h.valid}</span>
                  <span className="mono text-xs text-gray-500">/</span>
                  <span className="mono text-xs text-gray-400">{h.total}</span>
                </div>
                <div className="w-12 bg-gray-800 rounded-full h-1 shrink-0">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-green-500 h-full rounded-full"
                    style={{ width: `${Math.round((h.valid / h.total) * 100)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 glass-card neon-border rounded-xl p-4">
          {!sel ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
              <Icon name="MousePointerClick" size={28} />
              <span className="text-xs">Выберите сессию</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-up">
              <div>
                <div className="text-sm font-bold text-white">{sel.source}</div>
                <div className="mono text-xs text-gray-500">{sel.date} · {sel.time} · {sel.duration}</div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Валидных', value: sel.valid, total: sel.total, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                  { label: 'Невалидных', value: sel.invalid, total: sel.total, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                  { label: 'Ошибок', value: sel.errors, total: sel.total, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="mono text-xs" style={{ color: item.color }}>{item.value} ({Math.round((item.value / item.total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(item.value / item.total) * 100}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="cyber-btn py-2 rounded-lg text-xs flex items-center justify-center gap-1.5">
                  <Icon name="Eye" size={12} />
                  Подробнее
                </button>
                <button className="glass-card border border-gray-700 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-all flex items-center justify-center gap-1.5">
                  <Icon name="Download" size={12} />
                  Скачать
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
