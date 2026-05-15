import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'; // ALTERADO AQUI
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { useAppStore } from './store/store';

import Login from './pages/Login';
import Hubs from './pages/Hubs';
import HubView from './pages/HubView';

function App() {
  const [initializing, setInitializing] = useState(true);
  const { user, isAuthorized, setUser, setAuthorized, theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUser(currentUser, userDoc.data().role);
        } else {
          setUser(currentUser, null);
        }
      } else {
        setUser(null, null);
        setAuthorized(false); 
      }
      setInitializing(false);
    });
    return () => unsubscribe();
  }, [setUser, setAuthorized]);

  if (initializing) {
    return (
      <div className="h-screen w-screen bg-igs-bg dark:bg-igs-dark flex flex-col items-center justify-center text-igs-primary dark:text-white transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-igs-primary mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse uppercase tracking-widest">Iniciando Zenjira</p>
      </div>
    );
  }

  // USO DO HASH ROUTER
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthorized ? "/hubs" : "/login"} />} />
        <Route path="/login" element={!isAuthorized ? <Login /> : <Navigate to="/hubs" />} />
        <Route path="/hubs" element={user && isAuthorized ? <Hubs /> : <Navigate to="/login" />} />
        <Route path="/hubs/:hubId" element={user && isAuthorized ? <HubView /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;