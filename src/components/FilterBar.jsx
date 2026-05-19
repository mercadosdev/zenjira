import { useAppStore } from '../store/store';
import { Search, X } from 'lucide-react';
import { t } from '../utils/i18n';
import { CustomSelect } from './CustomUI'; 
import { STATUS_OPTIONS, CATEGORIAS } from '../utils/constants';

export default function FilterBar({ searchTerm, setSearchTerm, filters, setFilters, quadros }) {
  const { userRole, language, igsUsers } = useAppStore();
  const isIgs = userRole === 'igs';

  const updateFilter = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Reduzimos o padding e o texto para um visual mais enxuto
  const inputClass = "px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-igs-primary text-xs text-slate-800 dark:text-slate-200 transition-all w-full";

  const quadroOptions = [{ value: '', label: t(language, 'Qualquer Quadro') }, ...(quadros || []).map(q => ({ value: q.id, label: q.name }))];
  const respOptions = [{ value: '', label: t(language, 'Qualquer Responsável') }, ...igsUsers.map(u => ({ value: u.name, label: u.name }))];
  const statusOptions = [{ value: '', label: t(language, 'status') }, ...STATUS_OPTIONS.map(s => ({ value: s, label: s }))];
  const catOptions = [{ value: '', label: t(language, 'Categoria') }, ...CATEGORIAS.map(c => ({ value: c.label, label: c.label }))];
  const tipoOptions = [{ value: '', label: t(language, 'type') }, { value: 'Jogo', label: t(language, 'Jogo') }, { value: 'Servidor', label: t(language, 'Servidor') }];

  return (
    <div className="bg-slate-50 dark:bg-igs-panel p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 md:gap-3 items-center shadow-sm relative z-[150]">
      
      {/* Busca */}
      <div className="flex-1 min-w-[160px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder={isIgs ? "Buscar Tarefa, Zendesk..." : "Buscar Tarefa ou Zendesk..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${inputClass} pl-9`}
        />
      </div>

      {/* Filtros agora usam flex-1 e min-width para se acomodarem na mesma linha sempre que possível */}
      <div className="flex-1 min-w-[120px] max-w-[160px] z-[60]">
        <CustomSelect value={filters.quadroId || ''} onChange={(val) => updateFilter('quadroId', val)} options={quadroOptions} />
      </div>

      <div className="flex-1 min-w-[120px] max-w-[170px] z-[50]">
        <CustomSelect value={filters.responsavel || ''} onChange={(val) => updateFilter('responsavel', val)} options={respOptions} />
      </div>

      <div className="flex-1 min-w-[110px] max-w-[140px] z-[40]">
        <CustomSelect value={filters.status || ''} onChange={(val) => updateFilter('status', val)} options={statusOptions} colorMap="status" />
      </div>
      
      <div className="flex-1 min-w-[110px] max-w-[140px] z-[30]">
        <CustomSelect value={filters.categoria || ''} onChange={(val) => updateFilter('categoria', val)} options={catOptions} colorMap="category" />
      </div>

      {isIgs && (
        <div className="flex-1 min-w-[100px] max-w-[120px] z-[20]">
          <CustomSelect value={filters.tipo || ''} onChange={(val) => updateFilter('tipo', val)} options={tipoOptions} />
        </div>
      )}

      {/* Botão com shrink-0 para não ser amassado pelos selects */}
      <button 
        onClick={() => { setSearchTerm(''); setFilters({ responsavel: '', status: '', categoria: '', tipo: '', quadroId: '' }); }}
        className="shrink-0 px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors text-xs font-bold flex items-center justify-center gap-1.5"
      >
        <X size={14} /> {t(language, 'Limpar')}
      </button>
    </div>
  );
}