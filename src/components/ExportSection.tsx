import { useState } from 'react';
import Icon from '@/components/ui/icon';

const formats = [
  { id: 'txt', label: 'TXT', desc: 'Простой текст, login:pass', icon: 'FileText', color: 'text-cyan-400', border: 'rgba(0,245,255,0.3)' },
  { id: 'csv', label: 'CSV', desc: 'Таблица с деталями', icon: 'Table', color: 'text-green-400', border: 'rgba(34,197,94,0.3)' },
  { id: 'json', label: 'JSON', desc: 'Структурированные данные', icon: 'Braces', color: 'text-purple-400', border: 'rgba(168,85,247,0.3)' },
  { id: 'xlsx', label: 'XLSX', desc: 'Excel-таблица', icon: 'FileSpreadsheet', color: 'text-orange-400', border: 'rgba(249,115,22,0.3)' },
];

const filters = [
  { id: 'all', label: 'Все', count: 5700 },
  { id: 'valid', label: 'Только валидные', count: 2191 },
  { id: 'invalid', label: 'Только невалидные', count: 3353 },
  { id: 'errors', label: 'Только ошибки', count: 156 },
];

export default function ExportSection() {
  const [selectedFormat, setSelectedFormat] = useState('txt');
  const [selectedFilter, setSelectedFilter] = useState('valid');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    }, 1500);
  };

  const currentFilter = filters.find(f => f.id === selectedFilter)!;

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-bold text-white">Экспорт результатов</h2>
        <p className="text-sm text-gray-500 mt-0.5">Сохраните результаты проверок в нужном формате</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card neon-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Icon name="Filter" size={15} className="text-cyan-400" />
            <span className="text-sm font-semibold text-gray-200">Фильтр данных</span>
          </div>

          <div className="space-y-2">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  selectedFilter === f.id
                    ? 'bg-cyan-500/12 border border-cyan-500/40'
                    : 'border border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedFilter === f.id ? 'bg-cyan-400 shadow-[0_0_6px_rgba(0,245,255,0.6)]' : 'bg-gray-600'
                  }`} />
                  <span className="text-sm text-gray-300">{f.label}</span>
                </div>
                <span className={`mono text-xs font-semibold ${selectedFilter === f.id ? 'text-cyan-400' : 'text-gray-500'}`}>
                  {f.count.toLocaleString('ru')}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-800 space-y-3">
            <div className="text-xs font-semibold text-gray-400 mb-2">Дополнительно</div>
            {[
              { label: 'Включить детали аккаунта', value: includeDetails, setter: setIncludeDetails },
              { label: 'Добавить временные метки', value: includeTimestamps, setter: setIncludeTimestamps },
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => opt.setter(!opt.value)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-xs text-gray-400">{opt.label}</span>
                <div className={`relative w-9 h-5 rounded-full transition-all ${opt.value ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                    style={{ left: opt.value ? '18px' : '2px' }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card neon-border-purple rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Icon name="FileDown" size={15} className="text-purple-400" />
            <span className="text-sm font-semibold text-gray-200">Формат файла</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {formats.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFormat(f.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedFormat === f.id
                    ? 'border'
                    : 'border border-gray-800 hover:border-gray-600'
                }`}
                style={selectedFormat === f.id ? {
                  borderColor: f.border,
                  background: f.border.replace('0.3', '0.08'),
                } : {}}
              >
                <Icon name={f.icon} fallback="File" size={18} className={`${f.color} mb-2`} />
                <div className={`text-sm font-bold mono ${selectedFormat === f.id ? f.color : 'text-gray-300'}`}>{f.label}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{f.desc}</div>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-gray-800">
            <div className="glass-card rounded-lg p-3 mb-3">
              <div className="mono text-[10px] text-gray-500">Предпросмотр</div>
              <div className="mono text-xs text-gray-400 mt-1.5">
                {selectedFormat === 'txt' && 'user@mail.com:pass123\nlogin2:password456\n...'}
                {selectedFormat === 'csv' && 'login,password,status,details\nuser@mail.com,pass123,valid,...'}
                {selectedFormat === 'json' && '[\n  {"login":"user@mail.com","status":"valid",...}\n]'}
                {selectedFormat === 'xlsx' && '[ Excel-файл с форматированием ]'}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>Будет экспортировано:</span>
              <span className="mono text-white font-semibold">{currentFilter.count.toLocaleString('ru')} записей</span>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                exported
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'cyber-btn'
              }`}
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin" />
                  Экспортирую...
                </>
              ) : exported ? (
                <><Icon name="Check" size={15} /> Готово! Скачивание...</>
              ) : (
                <><Icon name="Download" size={15} /> Экспортировать {selectedFormat.toUpperCase()}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
