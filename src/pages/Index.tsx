import { useState } from 'react';
import Icon from '@/components/ui/icon';
import CheckerSection from '@/components/CheckerSection';
import HistorySection from '@/components/HistorySection';
import ConfigSection from '@/components/ConfigSection';
import AnalyticsSection from '@/components/AnalyticsSection';
import ExportSection from '@/components/ExportSection';
import LogsSection from '@/components/LogsSection';

type Tab = 'checker' | 'history' | 'config' | 'analytics' | 'export' | 'logs';

const navItems: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'checker', label: 'Проверка', icon: 'ScanLine', desc: 'Запуск' },
  { id: 'history', label: 'История', icon: 'History', desc: 'Сессии' },
  { id: 'config', label: 'Настройки', icon: 'Settings2', desc: 'API & Proxy' },
  { id: 'analytics', label: 'Аналитика', icon: 'BarChart3', desc: 'Графики' },
  { id: 'export', label: 'Экспорт', icon: 'Download', desc: 'Файлы' },
  { id: 'logs', label: 'Логи', icon: 'Terminal', desc: 'Журнал' },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('checker');

  return (
    <div className="min-h-screen bg-[#080c14] grid-bg flex" style={{ fontFamily: "'Golos Text', sans-serif" }}>
      <aside className="w-[220px] shrink-0 flex flex-col border-r border-gray-800/60 bg-[#060a10]/80">
        <div className="px-5 py-5 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center animate-pulse-neon">
              <Icon name="Zap" size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">AccountChecker</div>
              <div className="mono text-[10px] text-cyan-500">PRO v2.0</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-cyan-500/15 to-purple-600/10 border border-cyan-500/25 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
              }`}
            >
              <Icon
                name={item.icon}
                fallback="Circle"
                size={16}
                className={activeTab === item.id ? 'text-cyan-400' : ''}
              />
              <div className="flex-1">
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-[10px] opacity-50">{item.desc}</div>
              </div>
              {activeTab === item.id && (
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-800/60">
          <div className="glass-card rounded-xl p-3 neon-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] mono text-gray-400">ONLINE</span>
            </div>
            <div className="text-xs text-gray-500">Готов к работе</div>
            <div className="text-[10px] mono text-gray-700 mt-1">Потоков: 10 / 50</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-800/60 flex items-center px-6 gap-4 bg-[#060a10]/50">
          <div className="flex items-center gap-2 flex-1">
            <Icon
              name={navItems.find(n => n.id === activeTab)?.icon || 'Circle'}
              fallback="Circle"
              size={16}
              className="text-cyan-400"
            />
            <span className="text-sm font-semibold text-gray-200">
              {navItems.find(n => n.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="mono text-[10px] text-gray-400">Proxy: OFF</span>
            </div>
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg">
              <Icon name="Cpu" size={12} className="text-gray-500" />
              <span className="mono text-[10px] text-gray-400">CPU: 12%</span>
            </div>
            <div className="w-8 h-8 rounded-lg glass-card border border-gray-700 flex items-center justify-center cursor-pointer hover:border-cyan-500/40 transition-all">
              <Icon name="Bell" size={14} className="text-gray-500" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'checker' && <CheckerSection />}
          {activeTab === 'history' && <HistorySection />}
          {activeTab === 'config' && <ConfigSection />}
          {activeTab === 'analytics' && <AnalyticsSection />}
          {activeTab === 'export' && <ExportSection />}
          {activeTab === 'logs' && <LogsSection />}
        </div>
      </main>
    </div>
  );
}
