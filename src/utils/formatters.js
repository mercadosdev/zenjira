const ZENDESK_BASE_URL = "https://ortizgaming.zendesk.com/agent/tickets/";
const JIRA_BASE_URL = "https://igsbrasil.atlassian.net/browse/";

export const parseLinks = (text, type) => {
  if (!text) return [];
  // Divide por vírgula ou espaço e remove espaços vazios
  const items = text.split(/[, ]+/).filter(item => item.trim() !== "");
  
  return items.map(item => {
    const cleanItem = item.trim();
    if (type === 'zendesk') {
      return { label: `ZD#${cleanItem}`, url: `${ZENDESK_BASE_URL}${cleanItem}` };
    }
    if (type === 'jira') {
      return { label: cleanItem, url: `${JIRA_BASE_URL}${cleanItem}` };
    }
    return null;
  }).filter(Boolean);
};