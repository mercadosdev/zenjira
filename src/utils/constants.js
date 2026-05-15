export const STATUS_COLORS = {
  "Na fila": "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  "Em Análise": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
  "Em Desenvolvimento": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  "QA": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800",
  "Testes EIBE": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  "Concluído": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
  "Na rua": "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800",
  "Cancelado": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800"
};

export const STATUS_OPTIONS = Object.keys(STATUS_COLORS);
export const COMPLEXIDADE_OPTIONS = ["Baixa", "Média", "Alta"];
export const MER_PRIORITIES = ["Highest", "High", "Normal"];

export const BOARD_COLORS = [
  { label: "Cinza", value: "bg-slate-100 dark:bg-slate-800/80 border-t-slate-400 dark:border-t-slate-500" },
  { label: "Roxo", value: "bg-purple-50 dark:bg-purple-900/30 border-t-purple-400 dark:border-t-purple-500" },
  { label: "Azul", value: "bg-blue-50 dark:bg-blue-900/30 border-t-blue-400 dark:border-t-blue-500" },
  { label: "Verde", value: "bg-emerald-50 dark:bg-emerald-900/30 border-t-emerald-400 dark:border-t-emerald-500" },
  { label: "Laranja", value: "bg-orange-50 dark:bg-orange-900/30 border-t-orange-400 dark:border-t-orange-500" },
  { label: "Vermelho", value: "bg-red-50 dark:bg-red-900/30 border-t-red-400 dark:border-t-red-500" },
  { label: "Rosa", value: "bg-pink-50 dark:bg-pink-900/30 border-t-pink-400 dark:border-t-pink-500" },
  { label: "Índigo", value: "bg-indigo-50 dark:bg-indigo-900/30 border-t-indigo-400 dark:border-t-indigo-500" },
  { label: "Ciano", value: "bg-cyan-50 dark:bg-cyan-900/30 border-t-cyan-400 dark:border-t-cyan-500" },
  { label: "Teal", value: "bg-teal-50 dark:bg-teal-900/30 border-t-teal-400 dark:border-t-teal-500" },
  { label: "Lima", value: "bg-lime-50 dark:bg-lime-900/30 border-t-lime-400 dark:border-t-lime-500" },
  { label: "Amarelo", value: "bg-yellow-50 dark:bg-yellow-900/30 border-t-yellow-400 dark:border-t-yellow-500" }
];