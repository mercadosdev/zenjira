import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useAppStore } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Plus, KeyRound, FolderKanban, LogOut, ShieldAlert, Hash, ArrowRight, Languages } from 'lucide-react';
import { t } from '../utils/i18n';

export default function Hubs() {
  const [hubs, setHubs] = useState([]);
  const [newHubName, setNewHubName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  
  const [joinHubId, setJoinHubId] = useState('');
  const [joinHubKey, setJoinHubKey] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  const { user, userRole, setActiveHub, setUserHubs, theme, toggleTheme, language, toggleLanguage, setIgsUsers, openDialog } = useAppStore();
  const navigate = useNavigate();
  const isIgs = userRole === 'igs';

  useEffect(() => {
    if (user) {
      fetchHubs();
      if (isIgs) fetchIgsUsers(); 
    }
  }, [user, isIgs]);

  const fetchHubs = async () => {
    const q = query(collection(db, 'hubs'), where('allowedUsers', 'array-contains', user.uid));
    const snapshot = await getDocs(q);
    const hubsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    hubsData.sort((a, b) => b.createdAt - a.createdAt);
    setHubs(hubsData);
    setUserHubs(hubsData);
  };

  const fetchIgsUsers = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'igs'));
    const snapshot = await getDocs(q);
    setIgsUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateHub = async () => {
    if (!newHubName || !accessKey) return alert("Preencha o nome e crie uma chave.");
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'hubs'), {
        name: newHubName,
        createdBy: user.uid,
        createdAt: new Date(),
        hasChanges: false,
        allowedUsers: [user.uid],
        clientEditors: [] 
      });
      alert(`Hub criado! ID: ${docRef.id}`);
      setNewHubName('');
      setAccessKey('');
      fetchHubs();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHubManual = async () => {
    if (!joinHubId || !joinHubKey) return alert("Insira o ID e a Chave.");
    setLoading(true);
    try {
      const hubRef = doc(db, 'hubs', joinHubId);
      const hubDoc = await getDoc(hubRef);
      
      if (hubDoc.exists()) {
        const hubData = { id: hubDoc.id, ...hubDoc.data() };
        
        const allowed = hubData.allowedUsers || [];
        if (!allowed.includes(user.uid)) {
          await updateDoc(hubRef, { allowedUsers: [...allowed, user.uid] });
        }

        setActiveHub(hubData, joinHubKey);
        navigate(`/hubs/${hubDoc.id}`);
      } else {
        alert("Hub não encontrado.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterHub = (hub) => {
    const success = setActiveHub(hub);
    if (!success) {
      // UTILIZA O MODAL PERSONALIZADO DO TIPO "PASSWORD" COM O OLHINHO
      openDialog({
        type: 'password',
        title: 'Chave E2EE',
        message: `Insira a chave para desencriptar "${hub.name}":`,
        onConfirm: (key) => {
          if (key) {
            setActiveHub(hub, key);
            navigate(`/hubs/${hub.id}`);
          }
        }
      });
    } else {
      navigate(`/hubs/${hub.id}`);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-igs-bg dark:bg-igs-dark text-slate-800 dark:text-slate-200 transition-colors duration-300 p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3 text-igs-primary">
            <FolderKanban size={36} />
            Zenjira
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col text-right px-3 hidden md:flex">
            <span className="text-sm font-bold">{user?.displayName}</span>
            <span className={`text-xs font-black uppercase tracking-wider ${isIgs ? 'text-igs-primary' : 'text-emerald-500'}`}>
              {isIgs ? 'Staff' : 'Cliente'}
            </span>
          </div>
          
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

          <button onClick={toggleLanguage} className="flex items-center gap-1 p-2 text-slate-500 hover:text-igs-primary dark:text-slate-400 font-bold text-xs" title="Mudar Idioma">
            <Languages size={18} /> {t(language, 'language')}
          </button>

          <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-igs-primary dark:text-slate-400" title="Tema">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400" title="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {isIgs && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full justify-between">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-igs-primary">
                  <Plus size={20} /> {t(language, 'createHub')}
                </h2>
                <div className="space-y-4">
                  <div className="relative">
                    <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input placeholder={t(language, 'hubName')} value={newHubName} onChange={e => setNewHubName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-igs-primary outline-none dark:text-white" />
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input placeholder={t(language, 'accessKey')} type="password" value={accessKey} onChange={e => setAccessKey(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-igs-primary outline-none dark:text-white" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button onClick={handleCreateHub} disabled={loading} className="w-full bg-igs-primary hover:bg-igs-accent text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                  {loading ? '...' : t(language, 'create')}
                </button>
              </div>
            </div>
          )}

          <div className={`bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full justify-between ${!isIgs ? 'lg:col-span-2 lg:w-1/2 lg:mx-auto' : ''}`}>
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <KeyRound size={20} /> {t(language, 'joinHub')}
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input placeholder={t(language, 'hubId')} value={joinHubId} onChange={e => setJoinHubId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white font-mono" />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input placeholder={t(language, 'accessKey')} type="password" value={joinHubKey} onChange={e => setJoinHubKey(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button onClick={handleJoinHubManual} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? '...' : t(language, 'enter')} <ArrowRight size={18}/>
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">{t(language, 'recentHubs')}</h2>
        
        {hubs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <FolderKanban size={48} className="mx-auto mb-4 opacity-20" />
            <p>{t(language, 'noHubs')}</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {hubs.map(hub => (
              <div key={hub.id} onClick={() => handleEnterHub(hub)} className="group bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-igs-primary dark:hover:border-igs-primary hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
                <div className="w-12 h-12 bg-igs-primary/10 dark:bg-slate-700 text-igs-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FolderKanban size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 group-hover:text-igs-primary transition-colors">{hub.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest">{t(language, 'hubId')}: {hub.id}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}