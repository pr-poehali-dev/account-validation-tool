import { useState } from 'react';
import Icon from '@/components/ui/icon';

const weekData = [
  { day: 'Пн', total: 800, valid: 312 },
  { day: 'Вт', total: 1200, valid: 487 },
  { day: 'Ср', total: 550, valid: 198 },
  { day: 'Чт', total: 2100, valid: 820 },
  { day: 'Пт', total: 3000, valid: 1102 },
  { day: 'Сб', total: 150, valid: 89 },
  { day: 'Вс', total: 1750, valid: 501 },
];

const maxVal = Math.max(...weekData.map(d => d.total));

const hourData = [2, 0, 0, 0, 1, 3, 8, 15, 22, 18, 12, 9, 14, 20, 17, 11, 8, 6, 4, 3, 5, 7, 4, 2];

export default function AnalyticsSection() {
  const [hover, setHover] = useState<number | null>(null);
  const [hoverHour, setHoverHour] = useState<number | null>(null);

  const totalAll = weekData.reduce((a, b) => a + b.total, 0);
  const validAll = weekData.reduce((a, b) => a + b.valid, 0);
  const rate = Math.round((validAll / totalAll) * 100);

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-bold text-white">Аналитика</h2>
        <p className="text-sm text-gray-500 mt-0.5">Статистика за последние 7 дней</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Всего проверено', value: totalAll.toLocaleString('ru'), icon: 'ScanLine', color: 'text-cyan-400', borderColor: 'rgba(0,245,255,0.2)' },
          { label: 'Валидных', value: validAll.toLocaleString('ru'), icon: 'CheckCircle', color: 'status-valid', borderColor: 'rgba(34,197,94,0.2)' },
          { label: 'Hit Rate', value: `${rate}%`, icon: 'TrendingUp', color: 'text-purple-400', borderColor: 'rgba(168,85,247,0.2)' },
          { label: 'Avg/сессия', value: Math.round(totalAll / 7).toLocaleString('ru'), icon: 'BarChart3', color: 'text-orange-400', borderColor: 'rgba(249,115,22,0.2)' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-4" style={{ border: `1px solid ${s.borderColor}` }}>
            <div className="flex items-center justify-between mb-2">
              <Icon name={s.icon} fallback="BarChart3" size={16} className={s.color} />
              <span className="mono text-[10px] text-gray-600">7д</span>
            </div>
            <div className={`text-xl font-bold mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 glass-card neon-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-semibold text-gray-300">Проверки по дням</span>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-cyan-500/60" /><span className="text-gray-500">Всего</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-500/70" /><span className="text-gray-500">Валидных</span></div>
            </div>
          </div>

          <div className="flex items-end gap-2 h-36">
            {weekData.map((d, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div className={`text-[10px] mono transition-opacity ${hover === i ? 'opacity-100 text-cyan-400' : 'opacity-0'}`}>
                  {d.total}
                </div>
                <div className="w-full flex flex-col items-center justify-end h-28 gap-0.5">
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${(d.total / maxVal) * 100}%`,
                      background: hover === i
                        ? 'linear-gradient(to top, rgba(0,245,255,0.6), rgba(0,245,255,0.2))'
                        : 'linear-gradient(to top, rgba(0,245,255,0.25), rgba(0,245,255,0.08))',
                    }}
                  />
                </div>
                <div className="w-full rounded-t-sm -mt-[calc(100%)]" style={{ display: 'none' }} />
                <div className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">{d.day}</div>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-2 h-16 mt-2 border-t border-gray-800 pt-3">
            {weekData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-12">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${(d.valid / maxVal) * 100}%`,
                    background: hover === i
                      ? 'linear-gradient(to top, rgba(34,197,94,0.8), rgba(34,197,94,0.3))'
                      : 'linear-gradient(to top, rgba(34,197,94,0.4), rgba(34,197,94,0.1))',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card neon-border rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-300 mb-4">Активность по часам</div>
          <div className="flex items-end gap-0.5 h-28">
            {hourData.map((v, i) => {
              const maxH = Math.max(...hourData);
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm cursor-pointer transition-all"
                  style={{
                    height: `${(v / maxH) * 100}%`,
                    background: hoverHour === i
                      ? 'rgba(168,85,247,0.8)'
                      : v > 15 ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.2)',
                    minHeight: '2px',
                  }}
                  onMouseEnter={() => setHoverHour(i)}
                  onMouseLeave={() => setHoverHour(null)}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-700 mono">00:00</span>
            <span className="text-[10px] text-gray-700 mono">12:00</span>
            <span className="text-[10px] text-gray-700 mono">23:00</span>
          </div>
          {hoverHour !== null && (
            <div className="mt-3 pt-3 border-t border-gray-800 animate-fade-up">
              <span className="mono text-xs text-gray-400">{String(hoverHour).padStart(2, '0')}:00 — </span>
              <span className="mono text-xs text-purple-400">{hourData[hoverHour]} сессий</span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Пиковый час</span>
              <span className="mono text-purple-400">14:00–15:00</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Лучший день</span>
              <span className="mono text-cyan-400">Пятница</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Hit Rate (7д)</span>
              <span className="mono text-green-400">{rate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}