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

  const inputClass = "px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-igs-primary text-sm text-slate-800 dark:text-slate-200 transition-all";

  // Arrays de Opções Mapeados para o Componente Customizado
  const quadroOptions = [{ value: '', label: t(language, 'Qualquer Quadro') }, ...(quadros || []).map(q => ({ value: q.id, label: q.name }))];
  const respOptions = [{ value: '', label: t(language, 'Qualquer Responsável') }, ...igsUsers.map(u => ({ value: u.name, label: u.name }))];
  const statusOptions = [{ value: '', label: t(language, 'status') }, ...STATUS_OPTIONS.map(s => ({ value: s, label: s }))];
  const catOptions = [{ value: '', label: t(language, 'Categoria') }, ...CATEGORIAS.map(c => ({ value: c.label, label: c.label }))];
  const tipoOptions = [{ value: '', label: t(language, 'type') }, { value: 'Jogo', label: t(language, 'Jogo') }, { value: 'Servidor', label: t(language, 'Servidor') }];

  return (
    <div className="bg-slate-50 dark:bg-igs-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 md:gap-4 items-center shadow-sm relative z-[150]">
      
      {/* Busca */}
      <div className="flex-1 min-w-[150px] md:max-w-xs relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder={isIgs ? "Buscar Tarefa, Zendesk..." : "Buscar Tarefa ou Zendesk..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${inputClass} w-full pl-10`}
        />
      </div>

      {/* Filtros em Z-Index escada para não sobreporem erradamente */}
      <div className="w-full sm:w-44 z-[60]">
        <CustomSelect value={filters.quadroId || ''} onChange={(val) => updateFilter('quadroId', val)} options={quadroOptions} />
      </div>

      <div className="w-full sm:w-52 z-[50]">
        <CustomSelect value={filters.responsavel || ''} onChange={(val) => updateFilter('responsavel', val)} options={respOptions} />
      </div>

      {/* NOVOS FILTROS GLOBAIS: Status e Categoria */}
      <div className="w-[calc(50%-6px)] sm:w-44 z-[40]">
        <CustomSelect value={filters.status || ''} onChange={(val) => updateFilter('status', val)} options={statusOptions} colorMap="status" />
      </div>
      
      <div className="w-[calc(50%-6px)] sm:w-44 z-[30]">
        <CustomSelect value={filters.categoria || ''} onChange={(val) => updateFilter('categoria', val)} options={catOptions} colorMap="category" />
      </div>

      {/* Tipo restrito ao IGS */}
      {isIgs && (
        <div className="w-full sm:w-36 z-[20]">
          <CustomSelect value={filters.tipo || ''} onChange={(val) => updateFilter('tipo', val)} options={tipoOptions} />
        </div>
      )}

      <button 
        onClick={() => { setSearchTerm(''); setFilters({ responsavel: '', status: '', categoria: '', tipo: '', quadroId: '' }); }}
        className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto mt-1 sm:mt-0"
      >
        <X size={16} /> {t(language, 'Limpar')}
      </button>
    </div>
  );
}