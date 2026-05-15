import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { useAppStore } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogIn, KeyRound, Building2, User, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Avatar } from '../components/CustomUI';

export default function Login() {
  const [step, setStep] = useState(1); 
  const [userRole, setUserRole] = useState(''); 
  const [masterKey, setMasterKey] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setAuthorized, setUser, theme, toggleTheme } = useAppStore();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser(user, data.role);
        setUserRole(data.role);
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (error) {
      console.error(error);
      alert("Falha na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userRole) return alert("Escolha um perfil.");
    setLoading(true);
    try {
      const user = auth.currentUser;
      const userData = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        role: userRole,
        createdAt: new Date()
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      setUser(user, userRole);
      setStep(3);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleEnterApp = () => {
    if (masterKey.length < 6) return alert("Chave deve ter 6+ caracteres.");
    sessionStorage.setItem('masterKey', masterKey);
    setAuthorized(true); 
    navigate('/hubs');
  };

  return (
    <div className="min-h-screen bg-igs-bg dark:bg-igs-dark flex items-center justify-center p-6 font-sans transition-colors duration-300 relative">
      
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-3 bg-white dark:bg-slate-800 rounded-full shadow-md text-slate-500 hover:text-igs-primary dark:text-slate-400 dark:hover:text-amber-400 transition-colors">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="bg-white dark:bg-igs-panel w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden border border-slate-100 dark:border-slate-800">
        
        <div className="text-center mb-10">
          <div className="bg-igs-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-purple-900/20">
            <LayoutDashboard size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">IGS Kanban</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Mercados & Delivery</p>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-igs-primary dark:hover:border-igs-primary text-slate-700 dark:text-slate-200 font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
              {loading ? 'Aguarde...' : 'Entrar com Google'}
            </button>
            <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 font-bold">
              <ShieldCheck size={12} /> ACESSO CORPORATIVO SEGURO
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center mb-6">
              <Avatar name={auth.currentUser?.displayName || 'Usuário'} size="xl" className="border-4 border-white dark:border-slate-800 shadow-xl" />
              <span className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest">{auth.currentUser?.displayName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setUserRole('igs')} className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${userRole === 'igs' ? 'border-igs-primary bg-igs-primary/10 text-igs-primary' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                <Building2 size={32} />
                <span className="font-black text-[10px] uppercase">Equipe IGS</span>
              </button>
              <button onClick={() => setUserRole('cliente')} className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${userRole === 'cliente' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                <User size={32} />
                <span className="font-black text-[10px] uppercase">Cliente</span>
              </button>
            </div>
            <button onClick={handleSaveProfile} disabled={!userRole || loading} className="w-full bg-igs-primary text-white font-black py-4 rounded-2xl shadow-xl hover:bg-igs-accent transition-all">
              {loading ? 'Salvando...' : 'Confirmar e Continuar'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="relative">
              <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" value={masterKey} onChange={(e) => setMasterKey(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleEnterApp()}
                placeholder="Insira sua Chave Mestra" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-igs-primary outline-none font-bold text-slate-900 dark:text-white transition-colors"
              />
            </div>
            <button onClick={handleEnterApp} className="w-full bg-slate-900 dark:bg-igs-primary text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-igs-accent transition-all">
              <LogIn size={20} /> Acessar Plataforma
            </button>
          </div>
        )}
      </div>
    </div>
  );
}