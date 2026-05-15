import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar as CalendarIcon, Activity, Bug, BugOff, Sparkles, HelpCircle, Repeat2, Binary } from 'lucide-react';
import { useAppStore } from '../store/store';
import { t } from '../utils/i18n';
import { STATUS_COLORS, CATEGORIAS } from '../utils/constants';

// ICON MAP PARA CATEGORIAS
const IconMap = {
  Bug, BugOff, Sparkles, HelpCircle, Repeat2, Binary
};

export function CategoryBadge({ categoryLabel, className = '' }) {
  const cat = CATEGORIAS.find(c => c.label === categoryLabel) || CATEGORIAS[0];
  const IconComponent = IconMap[cat.icon] || Binary;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium tracking-wide ${cat.color} ${className}`} title={cat.label}>
      <IconComponent size={12} />
      {cat.label}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS["Na fila"];
  const isAnalyzing = status === "Em Análise";
  
  return (
    <span className={`inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wider ${colorClass} ${className}`}>
      {isAnalyzing && <Activity size={12} className="animate-pulse" />}
      {status}
    </span>
  );
}

export function CustomSelect({ value, onChange, options, placeholder = "Selecione...", colorMap = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => (typeof o === 'string' ? o : o.value) === value) || placeholder;
  const isStringLabel = typeof selectedLabel === 'string';

  return (
    <div className="relative w-full" ref={ref}>
      <button 
        type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-igs-primary outline-none text-sm text-slate-800 dark:text-slate-200 transition-colors"
      >
        <span className="truncate flex items-center gap-2">
          {colorMap === 'status' && value ? <StatusBadge status={value} /> : 
           colorMap === 'category' && value ? <CategoryBadge categoryLabel={value} /> : 
           (isStringLabel ? selectedLabel : selectedLabel.label)}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute z-[100] w-full mt-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl max-h-60 overflow-y-auto custom-scrollbar p-1"
          >
            {options.map((opt, idx) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const label = typeof opt === 'string' ? opt : opt.label;
              return (
                <div 
                  key={idx} onClick={() => { onChange(val); setIsOpen(false); }}
                  className={`p-2 text-sm rounded-lg cursor-pointer transition-colors flex items-center ${value === val ? 'bg-igs-primary/10 text-igs-primary font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  {colorMap === 'status' ? <StatusBadge status={val} /> : 
                   colorMap === 'category' ? <CategoryBadge categoryLabel={val} /> : label}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CustomDatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirm = () => {
    if (tempDate !== value) onChange(tempDate); 
    setIsOpen(false);
  };

  const displayDate = value ? new Date(value + 'T12:00:00').toLocaleDateString() : 'Sem previsão';

  return (
    <div className="relative w-full" ref={ref}>
      <button 
        type="button" onClick={() => { setTempDate(value || ''); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-igs-primary outline-none text-sm text-slate-800 dark:text-slate-200 transition-colors"
      >
        <span>{displayDate}</span>
        <CalendarIcon size={16} className="text-slate-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute z-[100] mt-1 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-xl"
          >
            <input 
              type="date" value={tempDate} onChange={e => setTempDate(e.target.value)}
              className="w-full p-2 mb-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
            />
            <div className="flex justify-between gap-2">
              <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="text-xs text-red-500 font-semibold px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">Limpar</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="text-xs text-slate-500 font-semibold px-2 py-1">Cancelar</button>
                <button type="button" onClick={handleConfirm} className="text-xs text-white bg-igs-primary hover:bg-igs-accent font-semibold px-3 py-1 rounded">OK</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GlobalDialogs() {
  const { dialog, closeDialog, language } = useAppStore();
  const isPrompt = dialog?.type === 'prompt';
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (dialog?.type === 'prompt') {
      setInputValue(dialog.defaultValue || '');
    }
  }, [dialog]);

  if (!dialog) return null;

  const handleConfirm = () => {
    if (dialog.onConfirm) {
      isPrompt ? dialog.onConfirm(inputValue) : dialog.onConfirm(true);
    }
    closeDialog();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-igs-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{dialog.title}</h3>
        {dialog.message && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{dialog.message}</p>}
        
        {isPrompt && (
          <input 
            autoFocus type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            className="w-full p-3 mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-igs-primary outline-none dark:text-white"
          />
        )}

        <div className="flex justify-end gap-3 mt-2">
          <button onClick={closeDialog} className="px-4 py-2 font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">{t(language, 'cancel')}</button>
          <button onClick={handleConfirm} className="px-5 py-2 font-semibold text-white bg-igs-primary hover:bg-igs-accent rounded-xl shadow-lg transition-colors">Confirmar</button>
        </div>
      </motion.div>
    </div>
  );
}

export function Avatar({ name, size = 'md', className = '' }) {
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getGradient = (n) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-400 to-teal-500',
      'from-amber-400 to-orange-500',
      'from-purple-500 to-fuchsia-600',
      'from-pink-500 to-rose-500',
      'from-cyan-500 to-blue-600',
      'from-red-400 to-rose-600',
    ];
    if (!n) return gradients[0];
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-24 h-24 text-3xl'
  };

  return (
    <div className={`flex items-center justify-center rounded-full text-white font-semibold bg-gradient-to-br ${getGradient(name)} ${sizes[size]} ${className} shadow-sm shrink-0`}>
      {getInitials(name)}
    </div>
  );
}