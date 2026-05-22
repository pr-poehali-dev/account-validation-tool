import { useState } from 'react';
import Icon from '@/components/ui/icon';

export default function ConfigSection() {
  const [apiKey, setApiKey] = useState('');
  const [proxy, setProxy] = useState('');
  const [timeout, setTimeout] = useState(30);
  const [retries, setRetries] = useState(3);
  const [delay, setDelay] = useState(500);
  const [threads, setThreads] = useState(10);
  const [checkMode, setCheckMode] = useState('login');
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-bold text-white">Конфигурация</h2>
        <p className="text-sm text-gray-500 mt-0.5">Параметры проверки, прокси и API ключи</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card neon-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Key" size={15} className="text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">API ключи</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">Основной API ключ</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-••••••••••••••••"
                className="w-full mono text-xs bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 pr-10 transition-colors"
              />
              <Icon name="Eye" size={13} className="absolute right-3 top-3 text-gray-600 cursor-pointer hover:text-gray-400 transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">Резервный ключ (опционально)</label>
            <input
              type="password"
              placeholder="sk-••••••••••••••••"
              className="w-full mono text-xs bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">Режим проверки</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'login', label: 'Login' },
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' },
              ].map(m => (
                <button
                  key={m.value}
                  onClick={() => setCheckMode(m.value)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all mono ${
                    checkMode === m.value
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                      : 'border border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card neon-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Icon name="Globe" size={15} className="text-purple-400" />
              <span className="text-sm font-semibold text-gray-200">Прокси</span>
            </div>
            <button
              onClick={() => setProxyEnabled(!proxyEnabled)}
              className={`relative w-10 h-5 rounded-full transition-all ${proxyEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow ${proxyEnabled ? 'left-5.5' : 'left-0.5'}`} style={{ left: proxyEnabled ? '22px' : '2px' }} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500">Список прокси (IP:PORT:USER:PASS)</label>
            <textarea
              value={proxy}
              onChange={e => setProxy(e.target.value)}
              disabled={!proxyEnabled}
              placeholder={"192.168.1.1:8080:user:pass\n10.0.0.1:3128"}
              className="mono text-xs bg-gray-900/60 border border-gray-700 rounded-lg p-3 text-gray-300 placeholder-gray-600 resize-none h-24 focus:outline-none focus:border-purple-500/50 disabled:opacity-30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Тип прокси</label>
              <select className="bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-30 transition-colors" disabled={!proxyEnabled}>
                <option>HTTPS</option>
                <option>SOCKS5</option>
                <option>SOCKS4</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Ротация</label>
              <select className="bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-30 transition-colors" disabled={!proxyEnabled}>
                <option>По запросу</option>
                <option>Каждые 10</option>
                <option>Каждые 50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card neon-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Sliders" size={15} className="text-orange-400" />
          <span className="text-sm font-semibold text-gray-200">Параметры выполнения</span>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Потоки', value: threads, setter: setThreads, min: 1, max: 100, unit: 'x', color: 'text-cyan-400' },
            { label: 'Таймаут (сек)', value: timeout, setter: setTimeout, min: 5, max: 120, unit: 's', color: 'text-purple-400' },
            { label: 'Задержка (мс)', value: delay, setter: setDelay, min: 0, max: 5000, unit: 'ms', color: 'text-orange-400' },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-500">{item.label}</label>
                <span className={`mono text-sm font-bold ${item.color}`}>{item.value}<span className="text-xs font-normal text-gray-600"> {item.unit}</span></span>
              </div>
              <input
                type="range"
                min={item.min}
                max={item.max}
                value={item.value}
                onChange={e => item.setter(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between">
                <span className="mono text-[10px] text-gray-700">{item.min}</span>
                <span className="mono text-[10px] text-gray-700">{item.max}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800">
          <label className="text-xs text-gray-500">Повторных попыток:</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 5].map(n => (
              <button
                key={n}
                onClick={() => setRetries(n)}
                className={`w-9 h-8 rounded-lg text-xs mono font-semibold transition-all ${
                  retries === n ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400' : 'border border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            saved
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'cyber-btn'
          }`}
        >
          <Icon name={saved ? 'Check' : 'Save'} size={15} />
          {saved ? 'Сохранено!' : 'Сохранить настройки'}
        </button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium glass-card border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all flex items-center gap-2">
          <Icon name="RotateCcw" size={14} />
          Сбросить
        </button>
      </div>
    </div>
  );
}
