import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trash2 } from 'lucide-react';
import { Avatar } from './CustomUI'; 

export const logNotification = async (hubId, userName, message, type = 'info') => {
  if (!hubId) return;
  try {
    await addDoc(collection(db, `hubs/${hubId}/notifications`), {
      userName: userName || 'Sistema',
      message,
      type,
      createdAt: serverTimestamp(),
      read: false
    });
  } catch (error) { console.error("Erro:", error); }
};

export default function NotificationBell({ hubId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!hubId) return;
    const q = query(collection(db, `hubs/${hubId}/notifications`), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [hubId]);

  const handleClearAll = async () => {
    try {
      const q = query(collection(db, `hubs/${hubId}/notifications`));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      setIsOpen(false);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="relative z-[999]">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-slate-500 hover:text-blue-500 transition-colors">
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[999]"
          >
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <span className="font-bold text-sm">Notificações</span>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-bold"><Trash2 size={12}/> Limpar</button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-sm">Nenhuma atividade recente.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="p-4 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar name={n.userName} size="sm" />
                      <span className="text-[10px] font-black uppercase text-slate-400">{n.userName}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1.5">{n.message}</p>
                    <span className="text-[9px] text-slate-400 mt-2 block italic">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : 'Agora'}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}