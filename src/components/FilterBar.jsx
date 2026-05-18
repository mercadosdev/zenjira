import { useAppStore } from '../store/store';
import { Search, X } from 'lucide-react';
import { t } from '../utils/i18n';

export default function FilterBar({ searchTerm, setSearchTerm, filters, setFilters, quadros }) {
  const { userRole, language } = useAppStore();
  const isIgs = userRole === 'igs';

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = "px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-igs-primary text-sm text-slate-800 dark:text-slate-200 transition-all";

  return (
    <div className="bg-slate-50 dark:bg-igs-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center shadow-sm">
      
      {/* BUSCA GLOBAL */}
      <div className="flex-1 min-w-[280px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder={isIgs ? "Buscar Tarefa, Zendesk, Jira ou PKG..." : "Buscar Tarefa ou Zendesk..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${inputClass} w-full pl-10`}
        />
      </div>

      {/* NOVO: FILTRO DE QUADRO */}
      {quadros && (
        <select name="quadroId" value={filters.quadroId || ''} onChange={handleFilterChange} className={inputClass}>
          <option value="">{t(language, 'Qualquer Quadro')}</option>
          {quadros.map(q => (
            <option key={q.id} value={q.id}>{q.name}</option>
          ))}
        </select>
      )}

      {/* FILTROS GLOBAIS */}
      <select name="responsavel" value={filters.responsavel || ''} onChange={handleFilterChange} className={inputClass}>
        <option value="">{t(language, 'Qualquer Responsável')}</option>
      </select>

      {/* FILTROS IGS */}
      {isIgs && (
        <>
          <select name="prioridade" value={filters.prioridade || ''} onChange={handleFilterChange} className={inputClass}>
            <option value="">{t(language, 'priority')}</option>
            <option value="Baixa">{t(language, 'Baixa')}</option>
            <option value="Média">{t(language, 'Média')}</option>
            <option value="Alta">{t(language, 'Alta')}</option>
          </select>

          <select name="complexidade" value={filters.complexidade || ''} onChange={handleFilterChange} className={inputClass}>
            <option value="">{t(language, 'complexity')}</option>
            <option value="Baixa">{t(language, 'Baixa')}</option>
            <option value="Média">{t(language, 'Média')}</option>
            <option value="Alta">{t(language, 'Alta')}</option>
          </select>

          <select name="tipo" value={filters.tipo || ''} onChange={handleFilterChange} className={inputClass}>
            <option value="">{t(language, 'type')}</option>
            <option value="Jogo">{t(language, 'Jogo')}</option>
            <option value="Servidor">{t(language, 'Servidor')}</option>
          </select>
        </>
      )}

      <button 
        onClick={() => { setSearchTerm(''); setFilters({ responsavel: '', prioridade: '', complexidade: '', tipo: '', quadroId: '' }); }}
        className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors text-sm font-bold flex items-center gap-2"
      >
        <X size={16} /> {t(language, 'Limpar')}
      </button>
    </div>
  );
}