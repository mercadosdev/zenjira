import { useState } from 'react';
import { useAppStore } from '../store/store';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { encryptData } from '../utils/crypto';
import { useParams } from 'react-router-dom';
import { logNotification } from './NotificationBell';
import { t } from '../utils/i18n';

import { CustomSelect, CustomDatePicker, StatusBadge, CategoryBadge } from './CustomUI';
import { STATUS_OPTIONS, COMPLEXIDADE_OPTIONS, MER_PRIORITIES, CATEGORIAS } from '../utils/constants';

// Configuração atualizada das colunas, agora incluindo "Status"
const DEFAULT_COLUMNS = [
  { id: 'nome', label: 'Tarefa', minWidth: 'min-w-[200px]', isIgs: false },
  { id: 'status', label: 'Status', minWidth: 'min-w-[150px]', isIgs: false },
  { id: 'statusApp', label: 'Status Aplicação', minWidth: 'min-w-[150px]', isIgs: false }, // NOVA COLUNA AQUI
  { id: 'categoria', label: 'Categoria', minWidth: 'min-w-[150px]', isIgs: false },
  { id: 'quadroId', label: 'Quadro', minWidth: 'min-w-[150px]', isIgs: false, hideInHistory: true },
  { id: 'responsavel', label: 'Responsável', minWidth: 'min-w-[150px]', isIgs: false },
  { id: 'zendesk', label: 'Zendesk', minWidth: '', isIgs: false },
  { id: 'prioridade', label: 'Prioridade', minWidth: '', isIgs: true },
  { id: 'complexidade', label: 'Complexidade', minWidth: '', isIgs: true },
  { id: 'jira', label: 'Jira', minWidth: '', isIgs: true },
  { id: 'previsaoEntrega', label: 'Previsão', minWidth: '', isIgs: false }
];

export default function SpreadsheetView({ cards, quadros, isHistory = false, onViewCard, isClientEditor }) {
  const { hubId } = useParams();
  const { user, userRole, activeHubKey, igsUsers, language } = useAppStore();
  const isIgs = userRole === 'igs';
  const canEditInline = !isHistory && (isIgs || isClientEditor);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [editState, setEditState] = useState({ cardId: null, field: null, value: '' });

  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [draggedColIndex, setDraggedColIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === targetIndex) return;

    const newCols = [...columns];
    const [removed] = newCols.splice(draggedColIndex, 1);
    newCols.splice(targetIndex, 0, removed);
    setColumns(newCols);
    setDraggedColIndex(null);
  };

  const visibleColumns = columns.filter(col => {
    if (col.isIgs && !isIgs) return false;
    if (col.hideInHistory && isHistory) return false;
    return true;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const sortedCards = [...cards].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aValue = ['status', 'quadroId'].includes(sortConfig.key) ? a[sortConfig.key] : a.data?.[sortConfig.key] || '';
    let bValue = ['status', 'quadroId'].includes(sortConfig.key) ? b[sortConfig.key] : b.data?.[sortConfig.key] || '';
    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const getQuadroName = (quadroId) => {
    const q = quadros.find(q => q.id === quadroId);
    return q ? q.name : 'Sem quadro';
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="inline ml-1 opacity-40" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp size={14} className="inline ml-1 text-igs-primary" /> : <ArrowDown size={14} className="inline ml-1 text-igs-primary" />;
  };

  const handleStartEdit = (card, field, currentValue) => {
    if (!canEditInline) return; 
    setEditState({ cardId: card.id, field, value: currentValue || '' });
  };

  const handleSaveInline = async (card, overrideValue = null) => {
    const { field } = editState;
    const valueToSave = overrideValue !== null ? overrideValue : editState.value;
    
    if (editState.cardId !== card.id) return;
    setEditState({ cardId: null, field: null, value: '' }); 

    if (!valueToSave && !overrideValue) return;

    try {
      const cardRef = doc(db, `hubs/${hubId}/cards`, card.id);
      
      if (field === 'status' || field === 'quadroId') {
        await updateDoc(cardRef, { [field]: valueToSave, updatedAt: serverTimestamp() });
        await logNotification(hubId, user?.displayName, `Alterou o status/quadro da tarefa "${card.data.nome}"`, 'info');
      } else {
        const updatedData = { ...card.data, [field]: valueToSave };
        const encryptedContent = encryptData(updatedData, activeHubKey);
        await updateDoc(cardRef, { content: encryptedContent, updatedAt: serverTimestamp() });
        await logNotification(hubId, user?.displayName, `Atualizou dados da tarefa "${card.data.nome}"`, 'info');
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar alteração.");
    }
  };

  const handleKeyDown = (e, card) => {
    if (e.key === 'Enter') handleSaveInline(card);
    if (e.key === 'Escape') setEditState({ cardId: null, field: null, value: '' });
  };

  const renderCell = (card, field, displayValue, inputType = 'text', options = []) => {
    const isEditing = editState.cardId === card.id && editState.field === field;

    if (isEditing) {
      if (inputType === 'select') {
        let cMap = null;
        if (field === 'status') cMap = 'status';
        if (field === 'categoria') cMap = 'category';

        return (
          <div className="min-w-[160px]">
            <CustomSelect 
              value={editState.value} 
              options={options} 
              onChange={(val) => handleSaveInline(card, val)} 
              colorMap={cMap} 
            />
          </div>
        );
      }
      if (inputType === 'date') {
        return (
          <div className="min-w-[140px]">
            <CustomDatePicker 
              value={editState.value} 
              onChange={(val) => handleSaveInline(card, val)} 
            />
          </div>
        );
      }
      return (
        <input 
          autoFocus type={inputType} value={editState.value} 
          onChange={(e) => setEditState({ ...editState, value: e.target.value })}
          onBlur={() => handleSaveInline(card)}
          onKeyDown={(e) => handleKeyDown(e, card)}
          className="w-full p-2 text-sm bg-white dark:bg-slate-900 border-2 border-igs-primary rounded-xl outline-none text-slate-900 dark:text-white"
        />
      );
    }

    let finalDisplayValue = displayValue || '-';
    if (inputType === 'date' && displayValue) {
      finalDisplayValue = new Date(displayValue + 'T12:00:00').toLocaleDateString();
    }

    return (
      <div 
        onClick={(e) => { e.stopPropagation(); handleStartEdit(card, field, displayValue !== '-' ? displayValue : ''); }}
        className={`w-full min-h-[24px] flex items-center ${canEditInline ? 'cursor-text border border-transparent hover:border-slate-300 dark:hover:border-slate-600 rounded px-1 -mx-1 transition-colors' : ''} ${!displayValue || displayValue === '-' ? 'text-slate-400 italic' : ''}`}
        title={canEditInline ? "Clique para editar" : ""}
      >
        {field === 'status' ? <StatusBadge status={displayValue} /> : 
         field === 'categoria' && displayValue && displayValue !== '-' ? <CategoryBadge categoryLabel={displayValue} /> : finalDisplayValue}
      </div>
    );
  };

  const renderCellContent = (card, colId) => {
    switch (colId) {
      case 'nome': return <span className="font-semibold">{renderCell(card, 'nome', card.data?.nome)}</span>;
      case 'status': return renderCell(card, 'status', card.status, 'select', STATUS_OPTIONS);
      case 'statusApp': return renderCell(card, 'statusApp', card.data?.statusApp); // RENDERIZANDO AQUI
      case 'categoria': return renderCell(card, 'categoria', card.data?.categoria || 'Default', 'select', CATEGORIAS.map(c => ({value: c.label, label: c.label})));
      case 'quadroId': return renderCell(card, 'quadroId', getQuadroName(card.quadroId), 'select', quadros.map(q => ({ value: q.id, label: q.name })));
      case 'responsavel': return renderCell(card, 'responsavel', card.data?.responsavel, 'select', igsUsers.map(u => ({ value: u.name, label: u.name })));
      case 'zendesk': return renderCell(card, 'zendesk', card.data?.zendesk);
      case 'prioridade': return renderCell(card, 'prioridade', card.data?.prioridade, 'select', MER_PRIORITIES);
      case 'complexidade': return renderCell(card, 'complexidade', card.data?.complexidade, 'select', COMPLEXIDADE_OPTIONS);
      case 'jira': return renderCell(card, 'jira', card.data?.jira);
      case 'previsaoEntrega': return renderCell(card, 'previsaoEntrega', card.data?.previsaoEntrega, 'date');
      default: return '-';
    }
  };

  if (sortedCards.length === 0) {
    return (
      <div className="bg-white dark:bg-igs-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 font-medium">
        Nenhuma tarefa encontrada.
      </div>
    );
  }

  const thClass = "p-4 text-left font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors";
  const tdClass = "p-3 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/50 align-middle";

  return (
    <div className="overflow-x-auto bg-white dark:bg-igs-panel rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm pb-24">
      <table className="w-full border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-900/50">
          <tr>
            <th className={`${thClass} w-10 text-center`}>{t(language, 'Ver')}</th>
            
            {visibleColumns.map((col, idx) => (
              <th 
                key={col.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                className={`${thClass} ${col.minWidth} cursor-grab active:cursor-grabbing hover:bg-slate-200 dark:hover:bg-slate-700/80`}
                title="Arraste para reordenar"
              >
                <div className="flex items-center gap-1 w-full" onClick={() => requestSort(col.id)}>
                  {t(language, col.label)} <SortIcon columnKey={col.id} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {sortedCards.map((card, idx) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.01 }}
                key={card.id} 
                className={`transition-colors group hover:bg-slate-100 dark:hover:bg-slate-700/50 ${idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50 dark:bg-slate-800/30'}`}
              >
                <td className="p-3 text-center border-b border-slate-100 dark:border-slate-800/50">
                  <button onClick={() => onViewCard && onViewCard(card)} className="text-slate-400 hover:text-igs-primary transition-colors font-semibold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    Abrir
                  </button>
                </td>
                
                {visibleColumns.map(col => (
                  <td key={col.id} className={tdClass}>
                    {renderCellContent(card, col.id)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}