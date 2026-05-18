import { useState, useEffect } from 'react';
import { useAppStore } from '../store/store';
import { encryptData } from '../utils/crypto';
import { parseLinks } from '../utils/formatters';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { logNotification } from './NotificationBell';
import { X, FileText, UserCircle, Tag, Clock, AlertTriangle, Settings, Box, LayoutList, ExternalLink, Edit3, AlignLeft, CheckSquare, Plus, Trash2, TextCursorInput, Flame, Copy, History } from 'lucide-react';
import { t } from '../utils/i18n';

// Custom UI
import { CustomSelect, CustomDatePicker, StatusBadge, CategoryBadge } from './CustomUI';
import { STATUS_OPTIONS, COMPLEXIDADE_OPTIONS, MER_PRIORITIES, CATEGORIAS } from '../utils/constants';

export default function CardModal({ hubId, quadroId, card, mode, onClose, onSwitchToEdit, isClientEditor }) {
  const { user, userRole, activeHubKey, igsUsers, language, openDialog } = useAppStore();
  const isIgs = userRole === 'igs';
  const canEdit = isIgs || isClientEditor;

  const [nome, setNome] = useState('');
  const [statusApp, setStatusApp] = useState(''); 
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('Na fila');
  const [categoria, setCategoria] = useState('Default'); 
  const [responsavel, setResponsavel] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [previsaoEntrega, setPrevisaoEntrega] = useState('');
  const [zendesk, setZendesk] = useState('');
  const [envioPrioritario, setEnvioPrioritario] = useState(false); // NOVO
  
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  const [prioridade, setPrioridade] = useState('');
  const [jira, setJira] = useState(''); 
  const [comentariosInternos, setComentariosInternos] = useState('');
  const [complexidade, setComplexidade] = useState('Baixa');
  const [tipo, setTipo] = useState('Jogo');
  const [versao, setVersao] = useState('');
  const [pkg, setPkg] = useState('');
  const [dlv, setDlv] = useState('');
  const [versaoGerada, setVersaoGerada] = useState('');
  const [pkgGerada, setPkgGerada] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (card && (mode === 'edit' || mode === 'view')) {
      const data = card.data; 
      setNome(data?.nome || '');
      setStatusApp(data?.statusApp || ''); 
      setDescricao(data?.descricao || '');
      setStatus(card.status || 'Na fila');
      setCategoria(data?.categoria || 'Default'); 
      setResponsavel(data?.responsavel || '');
      setComentarios(data?.comentarios || '');
      setPrevisaoEntrega(data?.previsaoEntrega || '');
      setZendesk(data?.zendesk || '');
      setSubtasks(data?.subtasks || []); 
      setEnvioPrioritario(data?.envioPrioritario || false); 

      if (isIgs) {
        setPrioridade(data?.prioridade || '');
        setComplexidade(data?.complexidade || 'Baixa');
        setComentariosInternos(data?.comentariosInternos || '');
        setJira(data?.jira || ''); 
        setTipo(data?.troubleshooting?.tipo || 'Jogo');
        setVersao(data?.troubleshooting?.versao || '');
        setPkg(data?.troubleshooting?.pkg || '');
        setDlv(data?.delivery?.dlv || '');
        setVersaoGerada(data?.delivery?.versaoGerada || '');
        setPkgGerada(data?.delivery?.pkgGerada || '');
      }
    }
  }, [card, mode, isIgs]);

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id) => {
    if (!canEdit) return;
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const removeSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  // LÓGICA DE DUPLICAR
  const handleDuplicate = () => {
    openDialog({
      type: 'prompt',
      title: 'Duplicar Tarefa',
      message: 'Insira um nome para a nova tarefa:',
      defaultValue: `${nome} (Cópia)`,
      onConfirm: async (newName) => {
        if (!newName) return;
        setLoading(true);
        const newPayload = { ...card.data, nome: newName };
        const encrypted = encryptData(newPayload, activeHubKey);
        try {
          await addDoc(collection(db, `hubs/${hubId}/cards`), {
            quadroId: card.quadroId,
            status: card.status,
            order: Date.now(), 
            content: encrypted,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          await logNotification(hubId, user?.displayName, `Duplicou a tarefa "${nome}" para "${newName}"`, 'success');
          onClose();
        } catch(e) { console.error(e); }
        setLoading(false);
      }
    });
  };

  const handleSave = async () => {
    if (!canEdit) return;
    if (!nome) return alert("O Nome da Tarefa é obrigatório.");

    setLoading(true);

    let currentStatusAppUpdatedAt = card?.data?.statusAppUpdatedAt || null;
    if (statusApp !== (card?.data?.statusApp || '')) {
      currentStatusAppUpdatedAt = new Date().toISOString();
    }

    // LÓGICA DE ADIAMENTOS: Se a nova data é MAIOR que a antiga, soma +1
    let currentAdiamentos = card?.data?.adiamentosEntrega || 0;
    if (previsaoEntrega && card?.data?.previsaoEntrega) {
       const newDate = new Date(previsaoEntrega + 'T12:00:00');
       const oldDate = new Date(card.data.previsaoEntrega + 'T12:00:00');
       if (newDate > oldDate) {
          currentAdiamentos += 1;
       }
    }

    const cardDataPayload = {
      nome, 
      statusApp, 
      statusAppUpdatedAt: currentStatusAppUpdatedAt, 
      descricao, 
      categoria, 
      responsavel, 
      comentarios, 
      previsaoEntrega, 
      adiamentosEntrega: currentAdiamentos,
      zendesk, 
      subtasks,
      envioPrioritario,
      ...(isIgs && { prioridade, jira, comentariosInternos, complexidade, troubleshooting: { tipo, versao, pkg }, delivery: { dlv, versaoGerada, pkgGerada } })
    };

    const encryptedContent = encryptData(cardDataPayload, activeHubKey);

    try {
      if (mode === 'edit') {
        const cardRef = doc(db, `hubs/${hubId}/cards`, card.id);
        await updateDoc(cardRef, { status, content: encryptedContent, updatedAt: serverTimestamp() });
        await logNotification(hubId, user?.displayName, `Atualizou a tarefa: "${nome}"`, 'info');
      } else if (mode === 'create') {
        await addDoc(collection(db, `hubs/${hubId}/cards`), { quadroId, status, order: Date.now(), content: encryptedContent, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        await logNotification(hubId, user?.displayName, `Criou a tarefa: "${nome}"`, 'success');
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const isView = mode === 'view';
  const inputClass = "w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-igs-primary outline-none text-sm text-slate-800 dark:text-slate-200 transition-colors";
  const labelClass = "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px]";

  const renderLinks = (text, type) => {
    const links = parseLinks(text, type);
    if (!links.length) return <span className="text-slate-400 text-sm">Nenhum vínculo</span>;
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {links.map((link, idx) => (
          <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 bg-igs-primary/10 text-igs-primary hover:bg-igs-primary/20 rounded-lg text-xs font-semibold transition-colors border border-igs-primary/20">
            {link.label} <ExternalLink size={10} />
          </a>
        ))}
      </div>
    );
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length === 0 ? 0 : Math.round((completedSubtasks / subtasks.length) * 100);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start md:items-center z-[150] p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }} transition={{ type: "spring", bounce: 0.3 }}
          className="bg-white dark:bg-igs-panel p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative border border-slate-100 dark:border-slate-800 my-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="pr-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <LayoutList className="text-igs-primary shrink-0" />
                {isView ? nome : (mode === 'edit' ? t(language, 'editTask') : t(language, 'newTask'))}
              </h2>
              {isView && (
                <div className="mt-3 flex gap-2 items-center flex-wrap">
                  <StatusBadge status={status} />
                  {categoria && categoria !== 'Default' && <CategoryBadge categoryLabel={categoria} />}
                  {envioPrioritario && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 dark:border-red-900/60 text-[10px] font-bold tracking-wide text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"><Flame size={12}/> URGENTE</span>}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {isView && canEdit && (
                <>
                  <button onClick={handleDuplicate} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-igs-primary transition-colors" title="Duplicar Tarefa">
                    <Copy size={20} />
                  </button>
                  <button onClick={onSwitchToEdit} className="p-2 rounded-xl bg-igs-primary/10 text-igs-primary hover:bg-igs-primary/20 transition-colors" title={t(language, 'editTask')}>
                    <Edit3 size={20} />
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><X size={24} /></button>
            </div>
          </div>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-2 -mx-2 custom-scrollbar">
            
            {/* -------------------- MODO VIEW -------------------- */}
            {isView ? (
              <div className="space-y-6">

                {statusApp && (
                  <div>
                    <label className={labelClass}><TextCursorInput size={14}/> Status da Aplicação</label>
                    <p className="text-sm font-semibold text-igs-primary bg-igs-primary/5 border border-igs-primary/20 p-3 rounded-xl">{statusApp}</p>
                    {card.data?.statusAppUpdatedAt && (
                       <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Atualizado em: {new Date(card.data.statusAppUpdatedAt).toLocaleString()}</p>
                    )}
                  </div>
                )}

                {descricao && (
                  <div>
                    <label className={labelClass}><AlignLeft size={14}/> {t(language, 'description')}</label>
                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed">{descricao}</p>
                  </div>
                )}
                
                {(subtasks.length > 0) && (
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1"><CheckSquare size={14}/> {t(language, 'subtasks')}</label>
                      <span className="text-[10px] font-bold text-igs-primary">{progress}% Concluído</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-igs-primary'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="space-y-2">
                      {subtasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3">
                          <input type="checkbox" checked={task.completed} onChange={() => canEdit && toggleSubtask(task.id)} disabled={!canEdit} className="w-4 h-4 rounded text-igs-primary border-slate-300 focus:ring-igs-primary transition-all cursor-pointer"/>
                          <span className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div>
                    <label className={labelClass}><UserCircle size={14}/> {t(language, 'responsible')}</label>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{responsavel || '-'}</div>
                  </div>
                  <div>
                    <label className={labelClass}><Clock size={14}/> {t(language, 'deliveryDate')}</label>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{previsaoEntrega ? new Date(previsaoEntrega + 'T12:00:00').toLocaleDateString() : '-'}</div>
                      {card.data?.adiamentosEntrega > 0 && (
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-md flex items-center gap-1" title={`${card.data.adiamentosEntrega} adiamentos de entrega`}>
                          <History size={10} /> +{card.data.adiamentosEntrega}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className={labelClass}>Zendesk (Tickets)</label>
                    {renderLinks(zendesk, 'zendesk')}
                  </div>
                </div>

                {comentarios && (
                  <div>
                    <label className={labelClass}>{t(language, 'comments')}</label>
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic border-l-4 border-slate-300 dark:border-slate-600 pl-3 py-1">{comentarios}</p>
                  </div>
                )}

                {isIgs && (
                  <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-6 mt-6">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Settings size={16} className="text-slate-400" /> {t(language, 'internalFields')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div><label className={labelClass}>{t(language, 'complexity')}</label><div className="text-sm font-semibold">{complexidade}</div></div>
                      <div><label className={labelClass}>{t(language, 'priority')}</label><div className="text-sm font-semibold">{prioridade || '-'}</div></div>
                      <div className="col-span-1 md:col-span-2"><label className={labelClass}>Jira (Issues)</label>{renderLinks(jira, 'jira')}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <h4 className="font-bold text-[10px] uppercase text-amber-800 dark:text-amber-500 mb-2 flex items-center gap-1"><AlertTriangle size={12} /> Troubleshooting</h4>
                        <div className="space-y-2 text-sm text-amber-900 dark:text-amber-400">
                          <p><strong>{t(language, 'type')}:</strong> {tipo}</p>
                          <p><strong>{t(language, 'version')}:</strong> {versao || '-'}</p>
                          <p><strong>PKG:</strong> {pkg || '-'}</p>
                        </div>
                      </div>
                      <div className="bg-igs-primary/5 p-4 rounded-xl border border-igs-primary/20">
                        <h4 className="font-bold text-[10px] uppercase text-igs-primary mb-2 flex items-center gap-1"><Box size={12} /> Delivery</h4>
                        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                          <p><strong>DLV:</strong> {dlv || '-'}</p>
                          <p><strong>Ver. Gerada:</strong> {versaoGerada || '-'}</p>
                          <p><strong>PKG Gerada:</strong> {pkgGerada || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (

              /* -------------------- MODO EDIT/CREATE -------------------- */
              <div className="space-y-5 pb-4">
                
                {/* CHECKBOX DE PRIORIDADE */}
                <div className="flex flex-wrap items-center gap-2 mb-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
                  <input type="checkbox" id="prioritario" checked={envioPrioritario} onChange={e => setEnvioPrioritario(e.target.checked)} className="w-5 h-5 rounded text-red-600 focus:ring-red-500 border-red-300 cursor-pointer" />
                  <label htmlFor="prioritario" className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2 cursor-pointer">
                    <Flame size={16} /> Marcar como Envio Prioritário (Urgente)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 z-[80] relative">
                  <div>
                    <label className={labelClass}><FileText size={14} className="text-slate-400"/> {t(language, 'taskName')} *</label>
                    <input value={nome} onChange={e => setNome(e.target.value)} className={inputClass} placeholder="Nome da Tarefa" />
                  </div>
                  <div>
                    <label className={labelClass}><TextCursorInput size={14} className="text-slate-400"/> Status da Aplicação</label>
                    <input value={statusApp} onChange={e => setStatusApp(e.target.value)} className={inputClass} placeholder="Ex: Aguardando Servidor, Falha API..." />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 z-[70] relative">
                  <div>
                    <label className={labelClass}><Tag size={14} className="text-slate-400"/> {t(language, 'status')}</label>
                    <CustomSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} colorMap="status" />
                  </div>
                  <div>
                    <label className={labelClass}><Box size={14} className="text-slate-400"/> Categoria</label>
                    <CustomSelect value={categoria} onChange={setCategoria} options={CATEGORIAS.map(c => ({value: c.label, label: c.label}))} colorMap="category" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>{t(language, 'description')}</label>
                  <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows="3" className={inputClass} />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <label className={labelClass}><CheckSquare size={14}/> {t(language, 'subtasks')}</label>
                  
                  <div className="space-y-2 mb-4">
                    {subtasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input type="checkbox" checked={task.completed} onChange={() => toggleSubtask(task.id)} className="w-4 h-4 rounded text-igs-primary cursor-pointer"/>
                        <input 
                          type="text" value={task.title} 
                          onChange={(e) => setSubtasks(subtasks.map(s => s.id === task.id ? { ...s, title: e.target.value } : s))}
                          className={`flex-1 bg-transparent text-sm outline-none ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`} 
                        />
                        <button onClick={() => removeSubtask(task.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 relative">
                    <input 
                      value={newSubtask} onChange={e=>setNewSubtask(e.target.value)} onKeyDown={e=>e.key === 'Enter' && handleAddSubtask()} 
                      placeholder={t(language, 'addSubtask')} className={`${inputClass} !py-2.5`} 
                    />
                    <button onClick={handleAddSubtask} className="px-5 bg-igs-primary hover:bg-igs-accent text-white rounded-xl font-bold transition-colors"><Plus size={18}/></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 z-[60] relative">
                   <div>
                    <label className={labelClass}>Zendesk</label>
                    <input value={zendesk} onChange={e => setZendesk(e.target.value)} placeholder="Ex: 12345, 67890" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}><Clock size={14} className="text-slate-400"/> {t(language, 'deliveryDate')}</label>
                    <CustomDatePicker value={previsaoEntrega} onChange={setPrevisaoEntrega} />
                  </div>
                </div>

                {isIgs && (
                  <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-6 mt-6">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                      <Settings size={16} className="text-slate-400" /> {t(language, 'internalFields')}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 z-[50] relative">
                      <div>
                        <label className={labelClass}><UserCircle size={14} className="text-slate-400"/> {t(language, 'responsible')}</label>
                        <CustomSelect value={responsavel} onChange={setResponsavel} options={igsUsers.map(u => u.name)} placeholder="Selecione..." />
                      </div>
                      <div>
                        <label className={labelClass}>{t(language, 'complexity')}</label>
                        <CustomSelect value={complexidade} onChange={setComplexidade} options={COMPLEXIDADE_OPTIONS} />
                      </div>
                      <div>
                        <label className={labelClass}>{t(language, 'priority')}</label>
                        <CustomSelect value={prioridade} onChange={setPrioridade} options={MER_PRIORITIES} placeholder="Selecione..." />
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className={labelClass}>Jira</label>
                      <input value={jira} onChange={e => setJira(e.target.value)} placeholder="Ex: MER-123, ONE-456" className={inputClass} />
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30 mb-5">
                      <h4 className="font-bold text-[10px] text-amber-800 dark:text-amber-500 mb-3 flex items-center gap-2 uppercase tracking-widest"><AlertTriangle size={14} /> Troubleshooting</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 z-[30] relative">
                        <div><label className="block text-[10px] font-semibold text-amber-700 mb-1">{t(language, 'type')}</label><CustomSelect value={tipo} onChange={setTipo} options={['Jogo', 'Servidor']} /></div>
                        <div><label className="block text-[10px] font-semibold text-amber-700 mb-1">{t(language, 'version')}</label><input value={versao} onChange={e => setVersao(e.target.value)} className={inputClass} /></div>
                        <div><label className="block text-[10px] font-semibold text-amber-700 mb-1">PKG</label><input value={pkg} onChange={e => setPkg(e.target.value)} className={inputClass} /></div>
                      </div>
                    </div>

                    <div className="bg-igs-primary/5 p-5 rounded-xl border border-igs-primary/20 mb-5">
                      <h4 className="font-bold text-[10px] text-igs-primary mb-3 flex items-center gap-2 uppercase tracking-widest"><Box size={14} /> Delivery</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div><label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">DLV</label><input value={dlv} onChange={e => setDlv(e.target.value)} className={inputClass} /></div>
                        <div><label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Ver. Gerada</label><input value={versaoGerada} onChange={e => setVersaoGerada(e.target.value)} className={inputClass} /></div>
                        <div><label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">PKG Gerada</label><input value={pkgGerada} onChange={e => setPkgGerada(e.target.value)} className={inputClass} /></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={onClose} className="px-5 py-3 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">{t(language, 'cancel')}</button>
                  <button onClick={handleSave} disabled={loading} className="px-8 py-3 bg-igs-primary hover:bg-igs-accent text-white font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50">
                    {loading ? '...' : t(language, 'save')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}