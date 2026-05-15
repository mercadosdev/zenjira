import { useState } from 'react';
import { useAppStore } from '../store/store';
import { encryptData } from '../utils/crypto';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { logNotification } from './NotificationBell';
import { X, Zap } from 'lucide-react';
import { CustomSelect } from './CustomUI';

export default function QuickAddModal({ hubId, quadros, onClose }) {
  const { user, userRole, activeHubKey, igsUsers } = useAppStore();
  const isIgs = userRole === 'igs';

  const [nome, setNome] = useState('');
  const [quadroId, setQuadroId] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [zendesk, setZendesk] = useState('');
  const [jira, setJira] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!nome) return alert("O Nome da Tarefa é obrigatório.");
    if (!quadroId) return alert("Selecione um quadro.");
    if (isIgs && !responsavel) return alert("O Responsável é obrigatório."); // Se for Staff, barra.

    setLoading(true);

    const cardDataPayload = {
      nome, 
      responsavel: isIgs ? responsavel : '', // Salva vazio se for cliente
      comentarios, 
      zendesk,
      ...(isIgs && { jira })
    };

    const encryptedContent = encryptData(cardDataPayload, activeHubKey);

    try {
      await addDoc(collection(db, `hubs/${hubId}/cards`), { 
        quadroId, status: "Na fila", content: encryptedContent, createdAt: serverTimestamp(), updatedAt: serverTimestamp() 
      });
      await logNotification(hubId, user?.displayName, `Criou rapidamente a tarefa: "${nome}"`, 'success');
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-igs-primary outline-none text-sm text-slate-800 dark:text-slate-200 transition-colors";

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }}
          className="bg-slate-50 dark:bg-igs-panel p-6 rounded-3xl w-full max-w-lg shadow-2xl relative border border-slate-100 dark:border-slate-800"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Zap className="text-amber-500 fill-amber-500" /> Adição Rápida
            </h2>
            <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-red-500"><X size={20} /></button>
          </div>
          
          <div className="space-y-4">
            <input autoFocus value={nome} onChange={e => setNome(e.target.value)} className={inputClass} placeholder="Nome da Tarefa *" />
            
            <div className={`grid ${isIgs ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <CustomSelect value={quadroId} onChange={setQuadroId} options={quadros.map(q => ({value: q.id, label: q.name}))} placeholder="Quadro *" />
              
              {/* Ocultado para clientes: */}
              {isIgs && (
                <CustomSelect value={responsavel} onChange={setResponsavel} options={igsUsers.map(u => u.name)} placeholder="Responsável *" />
              )}
            </div>

            <div className={`grid ${isIgs ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              <input value={zendesk} onChange={e => setZendesk(e.target.value)} placeholder="Zendesk" className={inputClass} />
              {isIgs && <input value={jira} onChange={e => setJira(e.target.value)} placeholder="Jira" className={inputClass} />}
            </div>

            <textarea value={comentarios} onChange={e => setComentarios(e.target.value)} rows="2" className={inputClass} placeholder="Comentário inicial (opcional)" />

            <button onClick={handleSave} disabled={loading} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg transition-colors disabled:opacity-50">
              {loading ? '...' : 'Adicionar Tarefa'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}