import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Activity } from 'lucide-react';
import { useAppStore } from '../store/store';
import { StatusBadge, Avatar } from './CustomUI'; // IMPORTANDO AVATAR E BADGE

export default function TeamModal({ cards, onClose }) {
  const { igsUsers } = useAppStore();

  const activeStatuses = ["Em Análise", "Em Desenvolvimento"];
  
  const teamStatus = igsUsers.map(user => {
    const userCards = cards.filter(c => c.data?.responsavel === user.name && activeStatuses.includes(c.status));
    return { ...user, activeTasks: userCards };
  });

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }}
          className="bg-white dark:bg-igs-panel p-6 rounded-3xl w-full max-w-2xl shadow-2xl relative border border-slate-100 dark:border-slate-800"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="text-igs-primary" /> Status da Equipe
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"><X size={20} /></button>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {teamStatus.map(member => (
              <div key={member.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* AVATAR DO MEMBRO DA EQUIPE */}
                    <Avatar name={member.name} size="md" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{member.name}</span>
                  </div>
                  {member.activeTasks.length > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500"><Activity size={12}/> Executando</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-slate-400">Livre</span>
                  )}
                </div>
                
                {member.activeTasks.length > 0 ? (
                  <div className="space-y-2">
                    {member.activeTasks.map(task => (
                      <div key={task.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[60%]">{task.data?.nome}</span>
                        <StatusBadge status={task.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhuma tarefa em execução no momento.</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}