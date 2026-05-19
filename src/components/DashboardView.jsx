import { useMemo } from 'react';
import { useAppStore } from '../store/store';
import { LayoutDashboard, CheckCircle2, Clock, AlertTriangle, Calendar, Flame, Activity, ListTodo, TrendingUp } from 'lucide-react';
import { StatusBadge, CategoryBadge, Avatar } from './CustomUI';
import { t } from '../utils/i18n';

export default function DashboardView({ cards, historyCards, quadros }) {
  const { language } = useAppStore();

  // 1. CÁLCULO DE KPIs GLOBAIS
  const totalActive = cards.length;
  const totalCompleted = historyCards.length;
  const urgentCount = cards.filter(c => c.data?.envioPrioritario).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueCount = cards.filter(c => {
    if (!c.data?.previsaoEntrega) return false;
    const d = new Date(c.data.previsaoEntrega + 'T12:00:00');
    d.setHours(0, 0, 0, 0);
    return d < today;
  }).length;

  // 2. DADOS POR QUADRO (Gráfico de Barras Horizontal)
  const cardsPerQuadro = useMemo(() => {
    return quadros.map(q => {
      const count = cards.filter(c => c.quadroId === q.id).length;
      return { 
        ...q, 
        count, 
        percentage: totalActive ? Math.round((count / totalActive) * 100) : 0 
      };
    }).sort((a, b) => b.count - a.count);
  }, [cards, quadros, totalActive]);

  // 3. PRÓXIMAS ENTREGAS
  const upcomingDeliveries = useMemo(() => {
    return [...cards]
      .filter(c => c.data?.previsaoEntrega)
      .sort((a, b) => new Date(a.data.previsaoEntrega) - new Date(b.data.previsaoEntrega))
      .slice(0, 6); // Pega as 6 próximas entregas
  }, [cards]);

  // 4. DISTRIBUIÇÃO DE STATUS
  const statusDist = useMemo(() => {
    const map = {};
    cards.forEach(c => {
      map[c.status] = (map[c.status] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({
      status, count, percentage: totalActive ? Math.round((count / totalActive) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }, [cards, totalActive]);

  // 5. CÁLCULO MENSAL (Entregues no mês atual)
  const completedThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return historyCards.filter(c => {
      if (!c.updatedAt) return false;
      const d = c.updatedAt?.toDate ? c.updatedAt.toDate() : new Date(c.updatedAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [historyCards]);

  const KpiCard = ({ title, value, subtitle, icon: Icon, colorClass, bgClass }) => (
    <div className="bg-white dark:bg-igs-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
        <Icon size={28} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{title}</h4>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{value}</span>
          {subtitle && <span className="text-xs font-semibold text-slate-400 mb-1">{subtitle}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-24 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-igs-primary/10 text-igs-primary rounded-2xl">
          <LayoutDashboard size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Dashboard do Hub</h2>
          <p className="text-sm font-medium text-slate-500">Visão analítica em tempo real das suas tarefas.</p>
        </div>
      </div>

      {/* CARDS DE KPI (MÉTRICAS PRINCIPAIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard 
          title="Tarefas Ativas" value={totalActive} subtitle="no kanban"
          icon={Activity} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50" 
        />
        <KpiCard 
          title="Entregas no Mês" value={completedThisMonth} subtitle="concluídas"
          icon={CheckCircle2} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50" 
        />
        <KpiCard 
          title="Urgentes" value={urgentCount} subtitle="alta prioridade"
          icon={Flame} colorClass="text-orange-600 dark:text-orange-400" bgClass="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50" 
        />
        <KpiCard 
          title="Atrasadas" value={overdueCount} subtitle="vencidas"
          icon={AlertTriangle} colorClass="text-red-600 dark:text-red-400" bgClass="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: GRÁFICOS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* GRÁFICO DE BARRAS: VOLUME POR QUADRO */}
          <div className="bg-white dark:bg-igs-panel p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
              <ListTodo size={20} className="text-igs-primary" /> Volume por Quadro
            </h3>
            
            {cardsPerQuadro.length === 0 ? (
              <p className="text-slate-500 italic text-sm">Nenhum quadro disponível.</p>
            ) : (
              <div className="space-y-5">
                {cardsPerQuadro.map(q => (
                  <div key={q.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{q.name}</span>
                      <div className="flex gap-3 text-slate-500">
                        <span className="font-semibold">{q.count} tarefas</span>
                        <span className="font-black text-igs-primary w-10 text-right">{q.percentage}%</span>
                      </div>
                    </div>
                    {/* Barra de Progresso Customizada Tailwind */}
                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3 border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                      <div 
                        className="bg-gradient-to-r from-igs-primary to-igs-accent h-full rounded-full transition-all duration-1000 ease-out relative" 
                        style={{ width: `${q.percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GRÁFICO: DISTRIBUIÇÃO DE STATUS */}
          <div className="bg-white dark:bg-igs-panel p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
              <TrendingUp size={20} className="text-igs-primary" /> Distribuição de Status
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {statusDist.length === 0 ? (
                <p className="text-slate-500 italic text-sm col-span-full">Sem tarefas ativas.</p>
              ) : (
                statusDist.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-between">
                    <div className="mb-3">
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{item.count}</span>
                      <span className="text-xs font-bold text-slate-400">{item.percentage}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: PRÓXIMAS ENTREGAS */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-igs-panel p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-igs-primary" /> Próximas Entregas
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">As 6 tarefas mais próximas do prazo final.</p>
            
            {upcomingDeliveries.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Clock size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 italic text-sm">Nenhuma tarefa com prazo definido.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingDeliveries.map(card => {
                  const deliveryDate = new Date(card.data.previsaoEntrega + 'T12:00:00');
                  deliveryDate.setHours(0, 0, 0, 0);
                  const diffTime = deliveryDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  let dateColor = "text-slate-500 dark:text-slate-400";
                  let dateBg = "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
                  
                  if (diffDays < 0) {
                    dateColor = "text-red-600 dark:text-red-400";
                    dateBg = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50";
                  } else if (diffDays === 0) {
                    dateColor = "text-orange-600 dark:text-orange-400";
                    dateBg = "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/50";
                  } else if (diffDays <= 3) {
                    dateColor = "text-amber-600 dark:text-amber-400";
                    dateBg = "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50";
                  }

                  return (
                    <div key={card.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:border-igs-primary/50 transition-colors group">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 truncate group-hover:text-igs-primary transition-colors">
                        {card.data.nome}
                      </h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={card.data.responsavel} size="sm" />
                          <span className="text-[10px] font-bold text-slate-500 truncate max-w-[80px]">{card.data.responsavel || 'Sem dono'}</span>
                        </div>
                        
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${dateColor} ${dateBg}`}>
                          <Clock size={12} />
                          {diffDays < 0 ? `Atrasado ${Math.abs(diffDays)}d` : diffDays === 0 ? 'Hoje' : `Em ${diffDays} dias`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Estilo embutido para a animação das barras de progresso */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}