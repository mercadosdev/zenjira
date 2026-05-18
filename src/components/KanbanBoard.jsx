import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAppStore } from '../store/store';
import { decryptData } from '../utils/crypto';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logNotification } from './NotificationBell';
import { Plus, Edit2, Trash2, Search, X, GripVertical, Palette, TextCursorInput, Copy, ArrowRight, ChevronUp, ChevronDown, Calendar, History, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOARD_COLORS } from '../utils/constants';
import { t } from '../utils/i18n';
import { StatusBadge, CategoryBadge } from './CustomUI';

const FEATURE_FLAG_BLUR_EFFECT = true;

export default function KanbanBoard({ hubId, quadros, cards, onViewCard, onAddCard, onRenameQuadro, onDeleteQuadro, isClientEditor }) {
  const { activeHubKey, userRole, user, language } = useAppStore();
  const isIgs = userRole === 'igs';
  const canEdit = isIgs || isClientEditor;

  const [colSearch, setColSearch] = useState({});
  const [showSearch, setShowSearch] = useState({});
  const [colorPickerOpen, setColorPickerOpen] = useState(null);

  const [focusedCardId, setFocusedCardId] = useState(null);
  const [pendingDrop, setPendingDrop] = useState(null);

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

    if (source.droppableId === destination.droppableId) {
      if (source.index === destination.index) return;
      handleReorder(source, destination, draggableId);
    } else {
      setPendingDrop(result);
    }
  };

  const handleReorder = async (source, destination, draggableId) => {
    const colCards = getSortedColCards(destination.droppableId);
    const newColCards = Array.from(colCards);
    const [moved] = newColCards.splice(source.index, 1);
    newColCards.splice(destination.index, 0, moved);

    const prev = destination.index > 0 ? newColCards[destination.index - 1] : null;
    const next = destination.index < newColCards.length - 1 ? newColCards[destination.index + 1] : null;
    
    const prevOrder = prev?.order ?? (prev?.createdAt?.toMillis ? prev.createdAt.toMillis() : 0);
    const nextOrder = next?.order ?? (next?.createdAt?.toMillis ? next.createdAt.toMillis() : (prevOrder + 100000));
    const newOrder = (prevOrder + nextOrder) / 2;

    try {
      await updateDoc(doc(db, `hubs/${hubId}/cards`, draggableId), { order: newOrder, updatedAt: new Date() });
    } catch(e) { console.error(e); }
  };

  const getSortedColCards = (quadroId) => {
    return cards.filter(c => c.quadroId === quadroId).sort((a, b) => {
      const orderA = a.order ?? (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
      const orderB = b.order ?? (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
      return orderA - orderB;
    });
  };

  const moveCardManual = async (cardId, quadroId, direction) => {
    if (!canEdit) return;
    const colCards = getSortedColCards(quadroId);
    const currentIndex = colCards.findIndex(c => c.id === cardId);
    if (currentIndex < 0) return;

    let newOrder;
    if (direction === 'up' && currentIndex > 0) {
      const prev = colCards[currentIndex - 1];
      const prevPrev = currentIndex > 1 ? colCards[currentIndex - 2] : null;
      const prevOrder = prev.order ?? (prev.createdAt?.toMillis ? prev.createdAt.toMillis() : 0);
      const prevPrevOrder = prevPrev ? (prevPrev.order ?? (prevPrev.createdAt?.toMillis ? prevPrev.createdAt.toMillis() : 0)) : prevOrder - 100000;
      newOrder = (prevOrder + prevPrevOrder) / 2;
    } else if (direction === 'down' && currentIndex < colCards.length - 1) {
      const next = colCards[currentIndex + 1];
      const nextNext = currentIndex < colCards.length - 2 ? colCards[currentIndex + 2] : null;
      const nextOrder = next.order ?? (next.createdAt?.toMillis ? next.createdAt.toMillis() : 0);
      const nextNextOrder = nextNext ? (nextNext.order ?? (nextNext.createdAt?.toMillis ? nextNext.createdAt.toMillis() : 0)) : nextOrder + 100000;
      newOrder = (nextOrder + nextNextOrder) / 2;
    } else {
      return; 
    }

    try {
      await updateDoc(doc(db, `hubs/${hubId}/cards`, cardId), { order: newOrder, updatedAt: new Date() });
    } catch (e) { console.error(e); }
  };

  const handleConfirmDrop = async (action) => {
    if (!pendingDrop) return;
    const { destination, draggableId } = pendingDrop;
    setPendingDrop(null);

    const destCards = getSortedColCards(destination.droppableId);
    const destQuadro = quadros.find(q => q.id === destination.droppableId);
    const cardToMove = cards.find(c => c.id === draggableId);
    if (!cardToMove || !destQuadro) return;

    const prev = destination.index > 0 ? destCards[destination.index - 1] : null;
    const next = destination.index < destCards.length ? destCards[destination.index] : null;
    const prevOrder = prev?.order ?? (prev?.createdAt?.toMillis ? prev.createdAt.toMillis() : 0);
    const nextOrder = next?.order ?? (next?.createdAt?.toMillis ? next.createdAt.toMillis() : (prevOrder + 100000));
    const newOrder = (prevOrder + nextOrder) / 2;

    const cardData = decryptData(cardToMove.content, activeHubKey);
    const taskName = cardData?.nome || 'Tarefa';

    try {
      if (action === 'move') {
        await updateDoc(doc(db, `hubs/${hubId}/cards`, draggableId), {
          quadroId: destination.droppableId,
          order: newOrder,
          updatedAt: new Date()
        });
        await logNotification(hubId, user?.displayName, `Moveu a tarefa "${taskName}" para "${destQuadro.name}"`, 'info');
      } else if (action === 'copy') {
        await addDoc(collection(db, `hubs/${hubId}/cards`), {
          quadroId: destination.droppableId,
          status: cardToMove.status,
          order: newOrder,
          content: cardToMove.content,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        await logNotification(hubId, user?.displayName, `Copiou a tarefa "${taskName}" para "${destQuadro.name}"`, 'success');
      }
    } catch (error) { console.error(error); }
  };

  const handleMouseEnter = (cardId, hasStatusApp) => {
    if (!FEATURE_FLAG_BLUR_EFFECT || !hasStatusApp) return;
    setFocusedCardId(cardId); 
  };

  const handleMouseLeave = () => {
    if (!FEATURE_FLAG_BLUR_EFFECT) return;
    setFocusedCardId(null);
  };

  const getDeliveryColorClass = (previsaoEntrega, complexidade) => {
    let baseBorder = isIgs && complexidade === 'Alta' ? 'border-red-500' : (isIgs && complexidade === 'Média' ? 'border-amber-500' : 'border-igs-primary');

    if (!previsaoEntrega) return baseBorder;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = new Date(previsaoEntrega + 'T12:00:00');
    delivery.setHours(0, 0, 0, 0);
    
    const diffTime = delivery - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'border-red-600 ring-1 ring-red-600 shadow-red-900/10'; 
    if (diffDays === 1) return 'border-orange-500 ring-1 ring-orange-500 shadow-orange-900/10'; 
    if (diffDays <= 7) return 'border-yellow-400 ring-1 ring-yellow-400 shadow-yellow-900/10'; 

    return baseBorder;
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 items-start h-full">
          <AnimatePresence>
            {quadros.map((quadro) => {
              let quadroCards = getSortedColCards(quadro.id).filter(c => !['Cancelado', 'Na rua'].includes(c.status));

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
                            
                            const leftBorder = cardData?.envioPrioritario 
                                               ? 'border-red-600 ring-1 ring-red-500 shadow-red-500/20' 
                                               : getDeliveryColorClass(cardData?.previsaoEntrega, cardData?.complexidade);
                            
                            const subtasks = cardData?.subtasks || [];
                            const completedSubtasks = subtasks.filter(s => s.completed).length;
                            const totalSubtasks = subtasks.length;
                            const progress = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);
                            const categoria = cardData?.categoria || 'Default';

                            const isFocused = focusedCardId === card.id;
                            const hasStatusApp = !!cardData?.statusApp;

                            return (
                              <Draggable key={card.id} draggableId={card.id} index={index} isDragDisabled={!canEdit}>
                                {(provided, snapshot) => {
                                  if (snapshot.isDragging && isFocused) handleMouseLeave();

                                  return (
                                    <div
                                      ref={provided.innerRef} {...provided.draggableProps} 
                                      onClick={() => onViewCard(card)} 
                                      onMouseEnter={() => handleMouseEnter(card.id, hasStatusApp)}
                                      onMouseLeave={handleMouseLeave}
                                      className={`group bg-white dark:bg-igs-panel p-4 mb-3 rounded-2xl border-l-4 cursor-pointer transition-all duration-300 ${leftBorder} ${
                                        snapshot.isDragging ? 'shadow-2xl scale-105 opacity-95 ring-2 ring-igs-primary z-[60]' : 
                                        isFocused ? 'relative z-[100] scale-105 shadow-2xl ring-4 ring-igs-primary/50' : 'shadow hover:shadow-lg border-y border-r border-slate-100 dark:border-slate-800 z-10'
                                      }`}
                                      style={{ ...provided.draggableProps.style }}
                                    >

                                      {/* BALÃO FLUTUANTE DE STATUS TOTALMENTE DESTACADO (ESCURO/INVERTIDO) */}
                                      {isFocused && hasStatusApp && (
                                        <div className="absolute z-[120] top-[calc(100%+16px)] left-1/2 -translate-x-1/2 w-64 p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl shadow-2xl shadow-slate-900/50 dark:shadow-black/80 border border-slate-700 dark:border-slate-800 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                                          {/* Triângulo apontando para o Card */}
                                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 dark:bg-slate-950 border-t border-l border-slate-700 dark:border-slate-800 rotate-45"></div>
                                          
                                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-purple-300 tracking-wider mb-2">
                                            <TextCursorInput size={12} /> Status da Aplicação
                                          </span>
                                          <p className="text-sm font-semibold text-white leading-snug">
                                            {cardData.statusApp}
                                          </p>
                                          
                                          {cardData.statusAppUpdatedAt && (
                                            <div className="mt-3 pt-2 border-t border-slate-700/80 flex justify-between items-center text-[9px] text-slate-400 font-medium uppercase tracking-widest">
                                              <span>Atualizado:</span>
                                              <span>{new Date(cardData.statusAppUpdatedAt).toLocaleString()}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        
                                        <div className="flex-1">
                                          {cardData?.envioPrioritario && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/60 text-[8px] font-bold tracking-widest text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 mb-2">
                                              <Flame size={10}/> URGENTE
                                            </span>
                                          )}
                                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm break-words leading-snug">
                                            {cardData?.nome || '⚠️ Falha ao descriptografar'}
                                          </h4>
                                        </div>

                                        {canEdit && (
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
                                              <button onClick={(e) => { e.stopPropagation(); moveCardManual(card.id, quadro.id, 'up'); }} className="p-0.5 text-slate-400 hover:text-igs-primary hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" title="Mover para cima"><ChevronUp size={14}/></button>
                                              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
                                              <button onClick={(e) => { e.stopPropagation(); moveCardManual(card.id, quadro.id, 'down'); }} className="p-0.5 text-slate-400 hover:text-igs-primary hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" title="Mover para baixo"><ChevronDown size={14}/></button>
                                            </div>
                                            <div {...provided.dragHandleProps} className="p-1 text-slate-300 dark:text-slate-600 hover:text-igs-primary cursor-grab active:cursor-grabbing" onClick={e => e.stopPropagation()}>
                                              <GripVertical size={16} />
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {cardData?.previsaoEntrega && (
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                            <Calendar size={12}/> {new Date(cardData.previsaoEntrega + 'T12:00:00').toLocaleDateString()}
                                          </span>
                                          {cardData?.adiamentosEntrega > 0 && (
                                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1 rounded" title={`${cardData.adiamentosEntrega} adiamentos registrados`}>
                                              <History size={10}/> +{cardData.adiamentosEntrega}
                                            </span>
                                          )}
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

      {/* MODAL DE CÓPIA/MOVER */}
      <AnimatePresence>
        {pendingDrop && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-igs-panel p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 text-center"
            >
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Ação da Tarefa</h3>
              <p className="text-sm text-slate-500 mb-6">Você arrastou a tarefa para outro quadro. Deseja movê-la ou criar uma cópia?</p>
              
              <div className="flex flex-col gap-3">
                <button onClick={() => handleConfirmDrop('move')} className="w-full py-3 bg-igs-primary hover:bg-igs-accent text-white font-bold rounded-xl transition-colors">
                  Mover Tarefa
                </button>
                <button onClick={() => handleConfirmDrop('copy')} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Copy size={18} /> Copiar Tarefa
                </button>
                <button onClick={() => setPendingDrop(null)} className="w-full py-3 mt-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold rounded-xl transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY DE BLUR GLOBAL */}
      {FEATURE_FLAG_BLUR_EFFECT && (
        <AnimatePresence>
          {focusedCardId && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm pointer-events-none transition-opacity duration-300"
            />
          )}
        </AnimatePresence>
      )}
    </>
  );
}