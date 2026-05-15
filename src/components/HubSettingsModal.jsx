import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppStore } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Trash2, Users, KeyRound, Eye, EyeOff, CheckCircle2, Edit3, Eye as EyeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '../utils/i18n';

export default function HubSettingsModal({ hubId, onClose }) {
  const { activeHub, activeHubKey, clearActiveHub, language } = useAppStore();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [clientEditors, setClientEditors] = useState([]); // NOVO ESTADO
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsersAndAccess();
  }, [hubId]);

  const fetchUsersAndAccess = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersList);

      const hubDoc = await getDoc(doc(db, 'hubs', hubId));
      if (hubDoc.exists()) {
        const data = hubDoc.data();
        setAllowedUsers(data.allowedUsers || []);
        setClientEditors(data.clientEditors || []);
      }
    } catch (error) { console.error(error); }
  };

  const toggleUserAccess = async (userId) => {
    setLoading(true);
    try {
      const isCurrentlyAllowed = allowedUsers.includes(userId);
      const newAllowedList = isCurrentlyAllowed 
        ? allowedUsers.filter(id => id !== userId) 
        : [...allowedUsers, userId];

      await updateDoc(doc(db, 'hubs', hubId), { allowedUsers: newAllowedList });
      setAllowedUsers(newAllowedList);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const toggleClientEditor = async (userId) => {
    setLoading(true);
    try {
      const isEditor = clientEditors.includes(userId);
      const newEditors = isEditor 
        ? clientEditors.filter(id => id !== userId) 
        : [...clientEditors, userId];

      await updateDoc(doc(db, 'hubs', hubId), { clientEditors: newEditors });
      setClientEditors(newEditors);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleDeleteHub = async () => {
    if (!window.confirm(`Tem certeza absoluta que deseja EXCLUIR permanentemente o hub "${activeHub.name}"?`)) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'hubs', hubId));
      clearActiveHub();
      navigate('/hubs');
    } catch (error) { console.error(error); setLoading(false); }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }}
          className="bg-white dark:bg-igs-panel p-8 rounded-3xl w-full max-w-3xl shadow-2xl relative border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <SettingsIcon className="text-igs-primary" /> {t(language, 'settings')}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar space-y-8">
            
            <div className="bg-igs-primary/5 border border-igs-primary/20 p-5 rounded-2xl">
              <h3 className="font-bold text-igs-primary flex items-center gap-2 mb-3">
                <KeyRound size={18} /> Chave Mestra (E2EE)
              </h3>
              <div className="flex items-center gap-3">
                <code className="flex-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-200 tracking-widest text-center font-bold">
                  {showKey ? activeHubKey : '••••••••••••••••'}
                </code>
                <button onClick={() => setShowKey(!showKey)} className="p-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors">
                  {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                <Users size={18} className="text-blue-500" /> {t(language, 'accessControl')}
              </h3>
              
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                  {users.map(u => {
                    const hasAccess = allowedUsers.includes(u.id);
                    const isClientEditor = clientEditors.includes(u.id);
                    const isClient = u.role === 'cliente';

                    return (
                      <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors gap-4">
                        <div>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{u.name}</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                            <span className={u.role === 'igs' ? 'text-blue-500' : 'text-emerald-500'}>{u.role}</span> • {u.email}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {isClient && hasAccess && (
                            <button 
                              onClick={() => toggleClientEditor(u.id)} disabled={loading}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all border ${isClientEditor ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700'}`}
                            >
                              {isClientEditor ? <><Edit3 size={12}/> {t(language, 'editor')}</> : <><EyeIcon size={12}/> {t(language, 'viewer')}</>}
                            </button>
                          )}
                          <button 
                            onClick={() => toggleUserAccess(u.id)} disabled={loading}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all border ${hasAccess ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700'}`}
                          >
                            {hasAccess ? <><CheckCircle2 size={12}/> {t(language, 'allowed')}</> : t(language, 'blocked')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-red-200 dark:border-red-900/30 pt-6 mt-6">
              <h3 className="font-bold text-red-600 dark:text-red-500 flex items-center gap-2 mb-4">
                <ShieldAlert size={18} /> {t(language, 'dangerZone')}
              </h3>
              <button onClick={handleDeleteHub} disabled={loading} className="w-full flex justify-center items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 px-6 py-4 rounded-2xl font-bold transition-colors disabled:opacity-50">
                <Trash2 size={18} /> {t(language, 'deleteHub')}
              </button>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SettingsIcon(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
}