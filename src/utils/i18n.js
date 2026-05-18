export const translations = {
  pt: {
    myHubs: "Meus Hubs", createHub: "Criar Novo Hub", joinHub: "Acessar Hub Existente", hubName: "Nome do Hub", accessKey: "Chave de Acesso",
    create: "Criar", enter: "Entrar no Hub", recentHubs: "Hubs Acessados Recentemente", noHubs: "Nenhum hub encontrado. Crie um para começar ou insira um ID.",
    hubId: "ID do Hub", settings: "Configurações", kanban: "Kanban", spreadsheet: "Planilha", history: "Histórico", backToHome: "Voltar ao Início",
    newTask: "Nova Tarefa", editTask: "Editar Tarefa", save: "Salvar", cancel: "Cancelar", taskName: "Nome da Tarefa", status: "Status",
    responsible: "Responsável", description: "Descrição", deliveryDate: "Previsão de Entrega", comments: "Comentários", internalFields: "Campos Internos IGS",
    priority: "Prioridade", complexity: "Complexidade", type: "Tipo", version: "Versão", dangerZone: "Zona de Perigo", deleteHub: "Excluir Hub Permanentemente",
    accessControl: "Controle de Acesso", editPermission: "Permissão de Edição", allowed: "Permitido", blocked: "Bloqueado", editor: "Editor", viewer: "Leitor",
    copyId: "Copiar ID", shareId: "ID do Hub (Compartilhar)", language: "ES", refresh: "Atualizar", subtasks: "Subtarefas", addSubtask: "Adicionar Subtarefa",
    boardColor: "Cor do Quadro", renameBoard: "Renomear", deleteBoard: "Excluir", selectOption: "Selecione...",
    
    // Status e Categorias
    "Na fila": "Na fila", "Em Análise": "Em Análise", "Em Desenvolvimento": "Em Desenvolvimento", "Concluído": "Concluído", "Na rua": "Na rua", "Cancelado": "Cancelado",
    "Bug": "Bug", "Bug Impeditivo": "Bug Impeditivo", "Recurso novo": "Recurso novo", "Dúvida": "Dúvida", "Reentrega": "Reentrega", "Default": "Padrão",
    "Baixa": "Baixa", "Média": "Média", "Alta": "Alta", "Jogo": "Jogo", "Servidor": "Servidor",
    
    // Filtros e Planilha
    "Qualquer Quadro": "Qualquer Quadro", "Qualquer Responsável": "Qualquer Responsável", "Categoria": "Categoria", "Quadro": "Quadro", "Limpar": "Limpar",
    "Ver": "Ver", "Tarefa": "Tarefa", "Zendesk": "Zendesk", "Prioridade": "Prioridade", "Jira": "Jira", "Previsão": "Previsão"
  },
  es: {
    myHubs: "Mis Hubs", createHub: "Crear Nuevo Hub", joinHub: "Acceder a Hub Existente", hubName: "Nombre del Hub", accessKey: "Clave de Acceso",
    create: "Crear", enter: "Entrar al Hub", recentHubs: "Hubs Accedidos Recientemente", noHubs: "No se encontró ningún hub. Crea uno para empezar o introduce un ID.",
    hubId: "ID del Hub", settings: "Configuraciones", kanban: "Kanban", spreadsheet: "Planilla", history: "Historial", backToHome: "Volver al Inicio",
    newTask: "Nueva Tarea", editTask: "Editar Tarea", save: "Guardar", cancel: "Cancelar", taskName: "Nombre de la Tarea", status: "Estado",
    responsible: "Responsable", description: "Descripción", deliveryDate: "Previsión de Entrega", comments: "Comentarios", internalFields: "Campos Internos IGS",
    priority: "Prioridad", complexity: "Complejidad", type: "Tipo", version: "Versión", dangerZone: "Zona de Peligro", deleteHub: "Eliminar Hub Permanentemente",
    accessControl: "Control de Acceso", editPermission: "Permiso de Edición", allowed: "Permitido", blocked: "Bloqueado", editor: "Editor", viewer: "Lector",
    copyId: "Copiar ID", shareId: "ID del Hub (Compartir)", language: "PT", refresh: "Actualizar", subtasks: "Subtareas", addSubtask: "Añadir Subtarea",
    boardColor: "Color del Tablero", renameBoard: "Renombrar", deleteBoard: "Eliminar", selectOption: "Seleccione...",
    
    // Status e Categorias Traduzidas
    "Na fila": "En cola", "Em Análise": "En Análisis", "Em Desenvolvimento": "En Desarrollo", "Concluído": "Completado", "Na rua": "En la calle", "Cancelado": "Cancelado",
    "Bug": "Bug", "Bug Impeditivo": "Bug Bloqueante", "Recurso novo": "Nueva Función", "Dúvida": "Duda", "Reentrega": "Reentrega", "Default": "Por Defecto",
    "Baixa": "Baja", "Média": "Media", "Alta": "Alta", "Jogo": "Juego", "Servidor": "Servidor",
    
    // Filtros e Planilha Traduzidos
    "Qualquer Quadro": "Cualquier Tablero", "Qualquer Responsável": "Cualquier Responsable", "Categoria": "Categoría", "Quadro": "Tablero", "Limpar": "Limpiar",
    "Ver": "Ver", "Tarefa": "Tarea", "Zendesk": "Zendesk", "Prioridade": "Prioridad", "Jira": "Jira", "Previsão": "Previsión"
  }
};
export const t = (lang, key) => translations[lang]?.[key] || key;