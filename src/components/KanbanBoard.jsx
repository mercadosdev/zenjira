import { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAppStore } from '../store/store';
import { decryptData } from '../utils/crypto';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logNotification } from './NotificationBell';
import { Plus, Edit2, Trash2, Search, X, GripVertical, Palette, TextCursorInput } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOARD_COLORS } from '../utils/constants';
import { t } from '../utils/i18n';
import { StatusBadge, CategoryBadge } from './CustomUI';

// FEATURE FLAG: Mude para false para desligar o efeito de Blur se houver problemas de performance.
const FEATURE_FLAG_BLUR_EFFECT = true;

export default function KanbanBoard({ hubId, quadros, cards, onViewCard, onAddCard, onRenameQuadro, onDeleteQuadro, isClientEditor }) {
  const { activeHubKey, userRole, user, language } = useAppStore();
  const isIgs = userRole === 'igs';
  const canEdit = isIgs || isClientEditor;

  const [colSearch, setColSearch] = useState({});
  const [showSearch, setShowSearch] = useState({});
  const [colorPickerOpen, setColorPickerOpen] = useState(null);

  // ESTADOS DO NOVO EFEITO DE FOCO (BLUR)
  const [focusedCardId, setFocusedCardId] = useState(null);
  const hoverTimer = useRef(null);

  const handleSearchChange = (quadroId, value) => setColSearch(prev => ({ ...prev, [quadroId]: value }));
  const toggleSearch = (quadroId) => {
    setShowSearch(prev => ({ ...prev, [quadroId]: !prev[quadroId] }));
    if (showSearch[quadroId]) handleSearchChange(quadroId, ''); 
  };

  const handleChangeQuadroColor = async (quadroId, colorValue) => {
    try {
      await updateDoc(doc(db, `hubs/${hubId}/quadros`, quadroId), { color: colorValue });
      setColorPickerOpen(null);
    } catch (e) { console.error(e); }
  };

  const onDragEnd = async (result) => {
    if (!canEdit) return; 

    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    try {
      const cardRef = doc(db, `hubs/${hubId}/cards`, draggableId);
      await updateDoc(cardRef, { quadroId: destination.droppableId, updatedAt: new Date() });

      const movedCard = cards.find(c => c.id === draggableId);
      const destQuadro = quadros.find(q => q.id === destination.droppableId);
      
      if (movedCard && destQuadro) {
        const cardData = movedCard.data || decryptData(movedCard.content, activeHubKey); 
        const taskName = cardData?.nome || 'Tarefa Oculta';
        await logNotification(hubId, user?.displayName, `Moveu a tarefa "${taskName}" para "${destQuadro.name}"`, 'info');
      }
    } catch (error) { console.error("Erro ao mover card:", error); }
  };

  // Funções do Hover
  const handleMouseEnter = (cardId) => {
    if (!FEATURE_FLAG_BLUR_EFFECT) return;
    hoverTimer.current = setTimeout(() => {
      setFocusedCardId(cardId);
    }, 5000);
  };

  const handleMouseLeave = () => {
    if (!FEATURE_FLAG_BLUR_EFFECT) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setFocusedCardId(null);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 items-start h-full">
          <AnimatePresence>
            {quadros.map((quadro) => {
              let quadroCards = cards.filter(c => c.quadroId === quadro.id && !['Cancelado', 'Na rua'].includes(c.status));

              const searchTerm = colSearch[quadro.id]?.toLowerCase();
              if (searchTerm) {
                quadroCards = quadroCards.filter(card => {
                  const data = card.data || decryptData(card.content, activeHubKey);
                  return data?.nome?.toLowerCase().includes(searchTerm) || 
                         data?.zendesk?.toLowerCase().includes(searchTerm) ||
                         data?.responsavel?.toLowerCase().includes(searchTerm);
                });
              }

              const boardTheme = quadro.color || BOARD_COLORS[0].value;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  key={quadro.id} className={`flex flex-col min-w-[320px] w-[320px] ${focusedCardId ? 'relative z-50' : ''}`}
                >
                  <div className={`p-4 rounded-t-2xl border-b border-slate-200 dark:border-slate-800 border-t-4 shadow-sm flex flex-col gap-2 relative transition-colors ${boardTheme}`}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-white m-0 flex items-center gap-2">
                        {quadro.name}
                        <span className="bg-white/50 dark:bg-black/20 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
                          {quadroCards.length}
                        </span>
                      </h3>
                      
                      <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                        <button onClick={() => toggleSearch(quadro.id)} className="p-1.5 hover:text-blue-500 hover:bg-white/40 dark:hover:bg-slate-900/40 rounded-lg transition-all"><Search size={16} /></button>
                        
                        {isIgs && (
                          <>
                            <div className="relative">
                              <button onClick={() => setColorPickerOpen(colorPickerOpen === quadro.id ? null : quadro.id)} className="p-1.5 hover:text-amber-500 hover:bg-white/40 dark:hover:bg-slate-900/40 rounded-lg transition-all"><Palette size={16} /></button>
                              {colorPickerOpen === quadro.id && (
                                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-2xl z-50 flex flex-col gap-1 w-32">
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase text-center mb-1">{t(language, 'boardColor')}</p>
                                  {BOARD_COLORS.map(c => (
                                    <div 
                                      key={c.label} onClick={() => handleChangeQuadroColor(quadro.id, c.value)}
                                      className={`h-6 rounded-md cursor-pointer border hover:scale-105 transition-transform ${c.value}`}
                                      title={c.label}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={() => onRenameQuadro(quadro.id, quadro.name)} className="p-1.5 hover:text-blue-500 hover:bg-white/40 dark:hover:bg-slate-900/40 rounded-lg transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => onDeleteQuadro(quadro.id, quadro.name)} className="p-1.5 hover:text-red-500 hover:bg-white/40 dark:hover:bg-slate-900/40 rounded-lg transition-all"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </div>

                    {showSearch[quadro.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="relative mt-2">
                        <input 
                          autoFocus type="text" placeholder="Filtrar tarefas..." value={colSearch[quadro.id] || ''} onChange={(e) => handleSearchChange(quadro.id, e.target.value)}
                          className="w-full pl-8 pr-8 py-2 text-sm rounded-xl border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-md text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-igs-primary transition-all shadow-inner"
                        />
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        {colSearch[quadro.id] && <button onClick={() => handleSearchChange(quadro.id, '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500"><X size={14} /></button>}
                      </motion.div>
                    )}
                  </div>

                  <Droppable droppableId={quadro.id} isDropDisabled={!canEdit}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} {...provided.droppableProps}
                        className={`flex-1 p-3 rounded-b-2xl transition-colors duration-200 min-h-[150px] shadow-sm border border-t-0 border-slate-200 dark:border-slate-800 ${
                          snapshot.isDraggingOver ? 'bg-slate-200 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900/30'
                        }`}
                      >
                        <AnimatePresence>
                          {quadroCards.map((card, index) => {
                            const cardData = card.data || decryptData(card.content, activeHubKey);
                            const leftBorder = isIgs && cardData?.complexidade === 'Alta' ? 'border-red-500' : (isIgs && cardData?.complexidade === 'Média' ? 'border-amber-500' : 'border-igs-primary');
                            
                            const subtasks = cardData?.subtasks || [];
                            const completedSubtasks = subtasks.filter(s => s.completed).length;
                            const totalSubtasks = subtasks.length;
                            const progress = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);
                            const categoria = cardData?.categoria || 'Default';

                            const isFocused = focusedCardId === card.id;

                            return (
                              <Draggable key={card.id} draggableId={card.id} index={index} isDragDisabled={!canEdit}>
                                {(provided, snapshot) => {
                                  // Se começar a arrastar enquanto o hover estiver ativo, cancelamos o blur
                                  if (snapshot.isDragging && isFocused) handleMouseLeave();

                                  return (
                                    <div
                                      ref={provided.innerRef} {...provided.draggableProps} 
                                      onClick={() => onViewCard(card)} 
                                      onMouseEnter={() => handleMouseEnter(card.id)}
                                      onMouseLeave={handleMouseLeave}
                                      className={`group bg-white dark:bg-igs-panel p-4 mb-3 rounded-2xl border-l-4 cursor-pointer transition-all duration-300 ${leftBorder} ${
                                        snapshot.isDragging ? 'shadow-2xl scale-105 opacity-95 ring-2 ring-igs-primary z-[60]' : 
                                        isFocused ? 'relative z-[100] scale-105 shadow-2xl ring-4 ring-igs-primary/50' : 'shadow hover:shadow-lg border-y border-r border-slate-100 dark:border-slate-800 z-10'
                                      }`}
                                      style={{ ...provided.draggableProps.style }}
                                    >
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm break-words leading-snug">
                                          {cardData?.nome || '⚠️ Falha ao descriptografar'}
                                        </h4>
                                        {canEdit && (
                                          <div {...provided.dragHandleProps} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                            <GripVertical size={16} />
                                          </div>
                                        )}
                                      </div>

                                      {/* NOVO: STATUS DA APLICAÇÃO VISÍVEL NO HOVER */}
                                      {cardData?.statusApp && (
                                        <div className="mt-1 mb-2 bg-igs-primary/5 border border-igs-primary/20 rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-igs-primary tracking-wider mb-0.5"><TextCursorInput size={10} /> Status da Aplicação</span>
                                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{cardData.statusApp}</p>
                                        </div>
                                      )}

                                      {totalSubtasks > 0 && (
                                        <div className="mb-3">
                                          <div className="flex justify-between text-[9px] font-semibold text-slate-400 mb-1">
                                            <span>Progresso</span>
                                            <span>{completedSubtasks}/{totalSubtasks}</span>
                                          </div>
                                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-igs-primary'}`} style={{ width: `${progress}%` }}></div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="flex justify-between items-center mt-3 gap-2 flex-wrap">
                                        <StatusBadge status={card.status} />
                                        {categoria && categoria !== 'Default' && <CategoryBadge categoryLabel={categoria} />}
                                      </div>

                                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                                        <span className="text-xs truncate max-w-[100px] font-medium text-slate-500 dark:text-slate-400" title={cardData?.responsavel}>{cardData?.responsavel || 'Sem dono'}</span>
                                        {isIgs && cardData?.jira && (
                                          <span className="inline-block bg-igs-primary/10 text-igs-primary border border-igs-primary/20 text-[9px] font-semibold px-2 py-0.5 rounded truncate max-w-[80px]">
                                            Jira: {cardData.jira}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }}
                              </Draggable>
                            );
                          })}
                        </AnimatePresence>
                        {provided.placeholder}
                        
                        {canEdit && (
                          <button 
                            onClick={() => onAddCard(quadro.id)}
                            className="w-full mt-2 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-igs-primary dark:hover:text-igs-accent hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                          >
                            <Plus size={18} /> {t(language, 'newTask')}
                          </button>
                        )}
                      </div>
                    )}
                  </Droppable>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isIgs && (
            <div className="min-w-[320px] w-[320px] flex flex-col">
              <button 
                onClick={() => { onRenameQuadro(null, '', true); }}
                className="h-14 flex items-center justify-center gap-2 bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 font-semibold transition-colors"
              >
                <Plus size={20} /> Criar Novo Quadro
              </button>
            </div>
          )}
        </div>
      </DragDropContext>

      {/* OVERLAY DE BLUR GLOBAL (Ativado após 5 segundos de hover) */}
      {FEATURE_FLAG_BLUR_EFFECT && (
        <AnimatePresence>
          {focusedCardId && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm pointer-events-none transition-opacity duration-500"
            />
          )}
        </AnimatePresence>
      )}
    </>
  );
}