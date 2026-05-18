import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, setDoc, deleteDoc, query, orderBy, getDoc, getDocs, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppStore } from '../store/store';
import { decryptData } from '../utils/crypto';
import { getKeyFromVault, removeKeyFromVault } from '../utils/keyVault'; 
import { FolderKanban, Sun, Moon, Kanban, Table, History, ChevronLeft, Copy, Check, Settings, Languages, RefreshCw, Zap, Users, User, Menu, X, PanelLeftClose, PanelLeftOpen, Home, KeyRound } from 'lucide-react';
import { t } from '../utils/i18n';

import CardModal from '../components/CardModal';
import KanbanBoard from '../components/KanbanBoard';
import SpreadsheetView from '../components/SpreadsheetView';
import FilterBar from '../components/FilterBar';
import NotificationBell, { logNotification } from '../components/NotificationBell';
import HubSettingsModal from '../components/HubSettingsModal';
import QuickAddModal from '../components/QuickAddModal';
import TeamModal from '../components/TeamModal';
import { GlobalDialogs, Avatar } from '../components/CustomUI'; 

const TERMINAL_STATUSES = ['Cancelado', 'Na rua'];

export default function HubView() {
  const { hubId } = useParams();
  const navigate = useNavigate();
  const { user, activeHub, userRole, activeHubKey, userHubs, setActiveHub, clearActiveHub, theme, toggleTheme, language, toggleLanguage, openDialog } = useAppStore();
  
  const [quadros, setQuadros] = useState([]);
  const [rawCards, setRawCards] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, mode: 'view', card: null, quadroId: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  
  const [isClientEditor, setIsClientEditor] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentView, setCurrentView] = useState('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ responsavel: '', prioridade: '', complexidade: '', tipo: '', quadroId: '' });
  const [copied, setCopied] = useState(false);

  const isIgs = userRole === 'igs';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarCollapsed(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!activeHub || !activeHubKey) {
        const vaultKey = getKeyFromVault(user?.uid, hubId);
        if (!vaultKey) {
           navigate('/hubs');
           return;
        }
        const hubInList = userHubs.find(h => h.id === hubId);
        if (hubInList) setActiveHub(hubInList, vaultKey);
        else { navigate('/hubs'); return; }
      }

      const hubDoc = await getDoc(doc(db, 'hubs', hubId));
      if (hubDoc.exists()) {
        const data = hubDoc.data();
        const allowed = data.allowedUsers || [];
        const editors = data.clientEditors || [];
        
        if (allowed.length > 0 && !allowed.includes(user?.uid)) {
          alert("Você não tem permissão para acessar este Hub.");
          clearActiveHub();
          navigate('/hubs');
        }
        if (!isIgs && editors.includes(user?.uid)) setIsClientEditor(true);
      }
    };
    verifyAccess();
  }, [activeHub, activeHubKey, hubId, userHubs, setActiveHub, navigate, user, clearActiveHub, isIgs]);

  useEffect(() => {
    if (rawCards.length > 0 && activeHubKey && user && hubId) {
       const testCard = rawCards[0];
       const testDecrypt = decryptData(testCard.content, activeHubKey);
       if (!testDecrypt || typeof testDecrypt !== 'object') {
          removeKeyFromVault(user.uid, hubId); 
          clearActiveHub();
          navigate('/hubs');
       }
    }
  }, [rawCards, activeHubKey, clearActiveHub, navigate, user, hubId]);

  useEffect(() => {
    if (activeHub && activeHubKey && user) {
      const presenceRef = doc(db, `hubs/${hubId}/presence`, user.uid);
      setDoc(presenceRef, { 
        name: user.displayName, 
        role: userRole, 
        lastActive: serverTimestamp() 
      }, { merge: true });

      const unsubPresence = onSnapshot(collection(db, `hubs/${hubId}/presence`), (snapshot) => {
        const now = new Date().getTime();
        const active = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.lastActive && (now - p.lastActive.toDate().getTime() < 15 * 60000));
        setOnlineUsers(active);
      });

      const qQuadros = query(collection(db, `hubs/${hubId}/quadros`), orderBy('createdAt', 'asc'));
      const unsubQuadros = onSnapshot(qQuadros, (snapshot) => {
        setQuadros(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const qCards = query(collection(db, `hubs/${hubId}/cards`));
      const unsubCards = onSnapshot(qCards, (snapshot) => {
        setRawCards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setIsRefreshing(false);
      });

      return () => { unsubQuadros(); unsubCards(); unsubPresence(); };
    }
  }, [activeHub, activeHubKey, hubId, user, userRole]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const processedCards = useMemo(() => {
    if (!activeHubKey) return [];
    
    // NOVA ORDENAÇÃO BASE: Ordena todos os cards pelo campo "order"
    let cardsData = rawCards.map(card => {
      const decrypted = decryptData(card.content, activeHubKey);
      return { ...card, data: decrypted };
    }).sort((a, b) => {
      const orderA = a.order ?? (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
      const orderB = b.order ?? (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
      return orderA - orderB;
    });

    if (searchTerm && currentView !== 'kanban') { 
      const lowerSearch = searchTerm.toLowerCase();
      cardsData = cardsData.filter(card => {
        const matchNome = card.data?.nome?.toLowerCase().includes(lowerSearch);
        const matchZendesk = card.data?.zendesk?.toLowerCase().includes(lowerSearch);
        let matchIgs = false;
        if (isIgs) {
          matchIgs = card.data?.jira?.toLowerCase().includes(lowerSearch) || 
                     card.data?.troubleshooting?.pkg?.toLowerCase().includes(lowerSearch);
        }
        return matchNome || matchZendesk || matchIgs;
      });
    }

    if (currentView !== 'kanban') {
      if (filters.responsavel) cardsData = cardsData.filter(c => c.data?.responsavel === filters.responsavel);
      if (filters.prioridade) cardsData = cardsData.filter(c => c.data?.prioridade === filters.prioridade);
      if (filters.complexidade) cardsData = cardsData.filter(c => c.data?.complexidade === filters.complexidade);
      if (filters.tipo) cardsData = cardsData.filter(c => c.data?.troubleshooting?.tipo === filters.tipo);
      if (filters.quadroId) cardsData = cardsData.filter(c => c.quadroId === filters.quadroId); 
    }

    return cardsData;
  }, [rawCards, activeHubKey, searchTerm, filters, isIgs, currentView]);

  const activeCards = processedCards.filter(c => !TERMINAL_STATUSES.includes(c.status));
  const historyCards = processedCards.filter(c => TERMINAL_STATUSES.includes(c.status));

  const handleQuadroAction = (id, name, isNew = false) => {
    openDialog({
      type: 'prompt',
      title: isNew ? 'Novo Quadro' : t(language, 'renameBoard'),
      defaultValue: isNew ? '' : name,
      onConfirm: async (value) => {
        if (!value || value === name) return;
        try {
          if (isNew) {
            await addDoc(collection(db, `hubs/${hubId}/quadros`), { 
              name: value, createdAt: new Date(), color: 'bg-slate-100 dark:bg-slate-800/80 border-t-slate-400 dark:border-t-slate-500' 
            });
            await logNotification(hubId, user?.displayName, `Criou o quadro: "${value}"`, 'success');
          } else {
            await updateDoc(doc(db, `hubs/${hubId}/quadros`, id), { name: value });
            await logNotification(hubId, user?.displayName, `Renomeou o quadro para "${value}".`, 'info');
          }
        } catch (error) { console.error(error); }
      }
    });
  };

  const handleDeleteQuadro = (quadroId, quadroName) => {
    openDialog({
      type: 'confirm',
      title: t(language, 'deleteBoard'),
      message: `Tem a certeza que deseja excluir o quadro "${quadroName}"? As tarefas dentro dele ficarão sem quadro.`,
      onConfirm: async (confirmed) => {
        if (confirmed) {
          try {
            await deleteDoc(doc(db, `hubs/${hubId}/quadros`, quadroId));
            await logNotification(hubId, user?.displayName, `Excluiu o quadro "${quadroName}".`, 'warning');
          } catch (error) { console.error(error); }
        }
      }
    });
  };

  const switchHub = async (hub) => {
    if (hub.id === hubId) {
      setIsSidebarOpen(false); 
      return;
    }
    
    const vaultKey = getKeyFromVault(user?.uid, hub.id);

    const promptForPassword = () => {
      openDialog({
        type: 'password',
        title: 'Chave E2EE',
        message: `Insira a chave para desencriptar "${hub.name}":`,
        onConfirm: async (key) => {
          if (key) {
            const q = query(collection(db, `hubs/${hub.id}/cards`), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
               const testCard = snap.docs[0].data();
               const testDecrypt = decryptData(testCard.content, key);
               if (!testDecrypt || typeof testDecrypt !== 'object') {
                  alert("⚠️ Chave incorreta! Tente novamente.");
                  setTimeout(promptForPassword, 300);
                  return;
               }
            }
            setActiveHub(hub, key);
            navigate(`/hubs/${hub.id}`);
            setIsSidebarOpen(false);
          }
        }
      });
    };

    if (vaultKey) {
       const q = query(collection(db, `hubs/${hub.id}/cards`), limit(1));
       const snap = await getDocs(q);
       if (!snap.empty) {
          const testCard = snap.docs[0].data();
          const testDecrypt = decryptData(testCard.content, vaultKey);
          if (!testDecrypt || typeof testDecrypt !== 'object') {
             removeKeyFromVault(user?.uid, hub.id);
             promptForPassword();
             return;
          }
       }
       setActiveHub(hub, vaultKey);
       navigate(`/hubs/${hub.id}`);
       setIsSidebarOpen(false);
    } else {
       promptForPassword();
    }
  };

  const openCreateModal = (quadroId) => setModalConfig({ isOpen: true, mode: 'create', card: null, quadroId });
  const openViewModal = (card) => setModalConfig({ isOpen: true, mode: 'view', card, quadroId: card.quadroId });
  const closeModal = () => setModalConfig({ isOpen: false, mode: 'view', card: null, quadroId: '' });

  const handleCopyId = () => {
    navigator.clipboard.writeText(hubId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeHub) {
    return (
      <div className="h-screen flex items-center justify-center bg-igs-bg dark:bg-igs-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-igs-primary"></div>
      </div>
    );
  }

  const btnViewClass = "px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all";

  return (
    <div className="flex h-screen overflow-hidden bg-igs-bg dark:bg-igs-dark text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      <GlobalDialogs /> 

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 transform transition-all duration-300 lg:relative lg:translate-x-0 bg-white dark:bg-igs-panelDark flex flex-col flex-shrink-0 shadow-2xl lg:shadow-lg border-r border-slate-200 dark:border-slate-800/50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        
        <div className={`p-6 pb-2 flex ${isSidebarCollapsed ? 'flex-col gap-4' : 'justify-between'} items-center`}>
          {!isSidebarCollapsed && (
            <div className="w-full">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="text-igs-primary shrink-0" size={24} /> <span className="truncate">Zenjira</span>
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-4 uppercase tracking-widest mb-2">{t(language, 'myHubs')}</p>
            </div>
          )}
          
          {isSidebarCollapsed && (
            <FolderKanban className="text-igs-primary shrink-0" size={28} />
          )}

          <button 
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-igs-primary rounded-xl transition-colors bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title="Alternar Menu"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <button className="lg:hidden p-2 text-slate-400 hover:text-red-500 rounded-xl transition-colors absolute top-4 right-4" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-3 mt-2 space-y-1.5 custom-scrollbar">
          {userHubs.map(hub => {
            const isActive = hub.id === hubId;
            const initials = hub.name.substring(0, 2).toUpperCase();
            
            return (
              <div 
                key={hub.id} onClick={() => switchHub(hub)}
                title={isSidebarCollapsed ? hub.name : undefined}
                className={`relative p-3 rounded-xl cursor-pointer flex items-center transition-all text-sm font-medium ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} ${
                  isActive 
                    ? 'bg-igs-primary text-white shadow-md shadow-igs-primary/40' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isSidebarCollapsed ? (
                  <span className="font-bold">{initials}</span>
                ) : (
                  <span className="truncate pr-2">{hub.name}</span>
                )}
                {!isSidebarCollapsed && hub.hasChanges && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse"></span>}
                {isSidebarCollapsed && hub.hasChanges && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white dark:border-igs-panelDark"></span>}
              </div>
            );
          })}
        </nav>
        
        <div className={`mx-3 mb-4 transition-all ${isSidebarCollapsed ? 'p-2 flex justify-center bg-transparent' : 'p-3 bg-slate-50 dark:bg-slate-800/50 shadow-inner'} rounded-xl border border-slate-200 dark:border-slate-700`}>
          {isSidebarCollapsed ? (
            <button onClick={handleCopyId} className="text-slate-400 hover:text-igs-primary transition-colors flex items-center justify-center h-8" title={t(language, 'copyId')}>
              {copied ? <Check size={20} className="text-emerald-500" /> : (
                <div className="relative flex items-center justify-center">
                  <KeyRound size={20} />
                  <div className="absolute -bottom-1 -right-2 bg-white dark:bg-igs-panelDark rounded-full p-[1px]">
                    <Copy size={12} />
                  </div>
                </div>
              )}
            </button>
          ) : (
            <>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2">{t(language, 'shareId')}</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-igs-accent font-mono truncate">{hubId}</code>
                <button onClick={handleCopyId} className="text-slate-400 hover:text-igs-primary dark:hover:text-white transition-colors flex-shrink-0" title={t(language, 'copyId')}>
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </>
          )}
        </div>

        <div className={`p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 transition-colors flex ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <button onClick={() => { clearActiveHub(); navigate('/hubs'); }} title={isSidebarCollapsed ? t(language, 'backToHome') : undefined} className={`py-3 ${isSidebarCollapsed ? 'px-3 w-auto' : 'px-4 w-full'} bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/90 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 font-medium text-sm border border-slate-200 hover:border-red-200 dark:border-slate-700 dark:hover:border-transparent shadow-sm`}>
            <Home size={18} className="shrink-0" /> {!isSidebarCollapsed && <span className="truncate">{t(language, 'backToHome')}</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white dark:bg-igs-panel border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex justify-between items-center z-10 shadow-sm transition-colors duration-300 shrink-0">
          <div className="flex items-center gap-2 lg:gap-6">
            
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden transition-colors"
            >
              <Menu size={24} />
            </button>

            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-white m-0 tracking-tight flex items-center gap-2 lg:gap-3">
                <span className="truncate max-w-[150px] lg:max-w-none">{activeHub.name}</span>
                {isIgs && (
                  <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-igs-primary hover:text-white text-slate-400 rounded-lg transition-colors" title={t(language, 'settings')}>
                    <Settings size={16} />
                  </button>
                )}
              </h1>
              <span className="text-[9px] lg:text-xs font-medium uppercase tracking-wider mt-1 flex gap-1">
                <span className="text-slate-400 hidden sm:inline">Acesso: </span>
                <span className={isIgs ? 'text-igs-primary font-bold' : (isClientEditor ? 'text-blue-500 font-bold' : 'text-emerald-500 font-bold')}>
                  {isIgs ? 'Staff' : (isClientEditor ? t(language, 'editor') : t(language, 'viewer'))}
                </span>
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 pl-6 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-medium text-slate-400 uppercase mr-2 tracking-widest">Online</span>
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 4).map(u => (
                  <div key={u.id} className="relative group" title={u.name}>
                    <Avatar name={u.name} size="md" className="border-2 border-white dark:border-igs-panel" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-igs-panel rounded-full z-10"></span>
                  </div>
                ))}
                {onlineUsers.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-igs-panel flex items-center justify-center text-[10px] font-semibold z-10 text-slate-500">
                    +{onlineUsers.length - 4}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 lg:gap-4">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {(isIgs || isClientEditor) && (
                <button onClick={() => setIsQuickAddOpen(true)} className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors" title="Adição Rápida">
                  <Zap size={14} className="fill-white" />
                </button>
              )}
              {isIgs && (
                <button onClick={() => setIsTeamModalOpen(true)} className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 bg-white dark:bg-slate-700 text-igs-primary dark:text-white rounded-lg text-xs font-bold shadow-sm transition-colors hover:text-blue-500" title="Status da Equipa">
                  <Users size={14} />
                </button>
              )}
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden lg:block"></div>

            <button onClick={handleManualRefresh} className={`p-2 text-slate-400 hover:text-blue-500 transition-colors hidden sm:block ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} title={t(language, 'refresh')}>
              <RefreshCw size={20} />
            </button>
            <button onClick={toggleLanguage} className="hidden sm:flex items-center gap-1 p-2 text-slate-400 hover:text-igs-primary dark:text-slate-400 font-medium text-xs">
              <Languages size={18} /> {t(language, 'language')}
            </button>
            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-igs-primary dark:hover:text-amber-400 rounded-full transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NotificationBell hubId={hubId} />
            
            <div className="hidden xl:flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1 ml-2">
              <button onClick={() => setCurrentView('kanban')} className={`${btnViewClass} ${currentView === 'kanban' ? 'bg-white dark:bg-slate-700 text-igs-primary dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}><Kanban size={16} /> {t(language, 'kanban')}</button>
              <button onClick={() => setCurrentView('planilha')} className={`${btnViewClass} ${currentView === 'planilha' ? 'bg-white dark:bg-slate-700 text-igs-primary dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}><Table size={16} /> {t(language, 'spreadsheet')}</button>
              <button onClick={() => setCurrentView('historico')} className={`${btnViewClass} ${currentView === 'historico' ? 'bg-white dark:bg-slate-700 text-igs-primary dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}><History size={16} /> {t(language, 'history')}</button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-transparent">
          
          {currentView !== 'kanban' && (
            <div className="p-4 md:px-8 md:pt-6 pb-0 shrink-0">
              <FilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} filters={filters} setFilters={setFilters} quadros={quadros} />
            </div>
          )}

          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <div className={`p-4 md:p-8 min-h-full flex flex-col ${currentView === 'kanban' ? 'min-w-max' : ''}`}>
              
              {currentView === 'kanban' && (
                <KanbanBoard 
                  hubId={hubId} quadros={quadros} cards={activeCards} 
                  onViewCard={openViewModal} onAddCard={openCreateModal}
                  onRenameQuadro={handleQuadroAction} onDeleteQuadro={handleDeleteQuadro}
                  isClientEditor={isClientEditor} 
                />
              )}

              {currentView === 'planilha' && <SpreadsheetView cards={activeCards} quadros={quadros} onViewCard={openViewModal} isClientEditor={isClientEditor} />}
              {currentView === 'historico' && <SpreadsheetView cards={historyCards} quadros={quadros} isHistory={true} onViewCard={openViewModal} isClientEditor={isClientEditor} />}
            </div>
          </div>

        </main>

        {modalConfig.isOpen && (
          <CardModal 
            hubId={hubId} quadroId={modalConfig.quadroId} card={modalConfig.card} mode={modalConfig.mode}
            onClose={closeModal} onSwitchToEdit={() => setModalConfig({ ...modalConfig, mode: 'edit' })}
            isClientEditor={isClientEditor} 
          />
        )}

        {isSettingsOpen && <HubSettingsModal hubId={hubId} onClose={() => setIsSettingsOpen(false)} />}
        {isQuickAddOpen && <QuickAddModal hubId={hubId} quadros={quadros} onClose={() => setIsQuickAddOpen(false)} />}
        {isTeamModalOpen && <TeamModal cards={activeCards} onClose={() => setIsTeamModalOpen(false)} />}
      </div>
    </div>
  );
}