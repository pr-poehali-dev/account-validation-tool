import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getProxyConfig, saveProxyConfig, PROXY_STORAGE_KEY } from '@/lib/proxyConfig';

export default function ConfigSection() {
  const [proxy, setProxy] = useState('');
  const [timeout, setTimeoutVal] = useState(30);
  const [retries, setRetries] = useState(3);
  const [delay, setDelay] = useState(500);
  const [threads, setThreads] = useState(5);
  const [proxyType, setProxyType] = useState('https');
  const [rotation, setRotation] = useState('each');
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [proxyValid, setProxyValid] = useState(0);

  useEffect(() => {
    const cfg = getProxyConfig();
    setProxyEnabled(cfg.enabled);
    setProxy(cfg.list.join('\n'));
    setProxyType(cfg.type);
    setRotation(cfg.rotation);
  }, []);

  useEffect(() => {
    const lines = proxy.split('\n').map(l => l.trim()).filter(Boolean);
    setProxyValid(lines.length);
  }, [proxy]);

  const handleSave = () => {
    const lines = proxy.split('\n').map(l => l.trim()).filter(Boolean);
    saveProxyConfig({ enabled: proxyEnabled, list: lines, type: proxyType, rotation });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    localStorage.removeItem(PROXY_STORAGE_KEY);
    setProxyEnabled(false);
    setProxy('');
    setProxyType('https');
    setRotation('each');
  };

  const testProxy = () => {
    const lines = proxy.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    alert(`Найдено ${lines.length} прокси. Тест будет доступен после сохранения.`);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-bold text-white">Конфигурация</h2>
        <p className="text-sm text-gray-500 mt-0.5">Параметры проверки и прокси</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card neon-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Sliders" size={15} className="text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">Параметры выполнения</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'Потоков (макс 150)', value: threads, setter: setThreads, min: 1, max: 150, unit: 'x', color: 'text-cyan-400' },
              { label: 'Таймаут (сек)', value: timeout, setter: setTimeoutVal, min: 10, max: 120, unit: 's', color: 'text-purple-400' },
              { label: 'Задержка между запросами (мс)', value: delay, setter: setDelay, min: 0, max: 5000, unit: 'ms', color: 'text-orange-400' },
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-1.5">
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

          <div className="flex items-center gap-4 pt-3 border-t border-gray-800">
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

        <div className="glass-card neon-border-purple rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Icon name="Globe" size={15} className="text-purple-400" />
              <span className="text-sm font-semibold text-gray-200">Прокси</span>
            </div>
            <div className="flex items-center gap-2">
              {proxyValid > 0 && (
                <span className="mono text-[10px] text-purple-400">{proxyValid} шт</span>
              )}
              <button
                onClick={() => setProxyEnabled(!proxyEnabled)}
                className={`relative w-10 h-5 rounded-full transition-all ${proxyEnabled ? 'bg-purple-500' : 'bg-gray-700'}`}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                  style={{ left: proxyEnabled ? '22px' : '2px' }}
                />
              </button>
            </div>
          </div>

          {proxyEnabled && (
            <div className="glass-card rounded-lg px-3 py-2 flex items-center gap-2 border border-purple-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs text-purple-400">Прокси активен — каждый аккаунт через отдельный IP</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500">Список прокси</label>
              <span className="mono text-[10px] text-gray-600">IP:PORT или IP:PORT:USER:PASS</span>
            </div>
            <textarea
              value={proxy}
              onChange={e => setProxy(e.target.value)}
              disabled={!proxyEnabled}
              placeholder={"192.168.1.1:8080\n10.0.0.1:3128:user:pass\nsocks5://1.2.3.4:1080"}
              className="mono text-xs bg-gray-900/60 border border-gray-700 rounded-lg p-3 text-gray-300 placeholder-gray-600 resize-none h-28 focus:outline-none focus:border-purple-500/50 disabled:opacity-30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Тип прокси</label>
              <select
                value={proxyType}
                onChange={e => setProxyType(e.target.value)}
                disabled={!proxyEnabled}
                className="bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-30 transition-colors"
              >
                <option value="https">HTTPS</option>
                <option value="socks5">SOCKS5</option>
                <option value="socks4">SOCKS4</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Ротация</label>
              <select
                value={rotation}
                onChange={e => setRotation(e.target.value)}
                disabled={!proxyEnabled}
                className="bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-30 transition-colors"
              >
                <option value="each">На каждый аккаунт</option>
                <option value="every10">Каждые 10</option>
                <option value="every50">Каждые 50</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={testProxy}
              disabled={!proxyEnabled || !proxyValid}
              className="flex-1 py-2 rounded-lg text-xs text-purple-400 border border-purple-500/30 hover:bg-purple-500/10 disabled:opacity-30 transition-all flex items-center justify-center gap-1.5"
            >
              <Icon name="Wifi" size={12} />
              Проверить прокси
            </button>
            <button
              onClick={() => setProxy('')}
              disabled={!proxyEnabled}
              className="px-3 py-2 rounded-lg text-xs text-gray-500 border border-gray-700 hover:border-gray-500 disabled:opacity-30 transition-all"
            >
              <Icon name="Trash2" size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card neon-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Info" size={14} className="text-cyan-400" />
          <span className="text-xs font-semibold text-gray-300">Формат прокси</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { format: 'IP:PORT', example: '1.2.3.4:8080', desc: 'Без авторизации' },
            { format: 'IP:PORT:USER:PASS', example: '1.2.3.4:8080:admin:secret', desc: 'С авторизацией' },
            { format: 'PROTO://IP:PORT', example: 'socks5://1.2.3.4:1080', desc: 'С протоколом' },
          ].map(f => (
            <div key={f.format} className="bg-gray-900/40 rounded-lg p-3">
              <div className="mono text-xs text-purple-400 font-semibold">{f.format}</div>
              <div className="mono text-[10px] text-gray-500 mt-1">{f.example}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{f.desc}</div>
            </div>
          ))}
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
        <button
          onClick={handleReset}
          className="px-5 py-2.5 rounded-xl text-sm font-medium glass-card border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all flex items-center gap-2"
        >
          <Icon name="RotateCcw" size={14} />
          Сбросить
        </button>
      </div>
    </div>
  );
}