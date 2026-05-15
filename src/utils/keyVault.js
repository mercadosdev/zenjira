// Salva a chave de um hub no LocalStorage, atrelada ao UID do usuário logado
export const saveKeyToVault = (userId, hubId, key) => {
  if (!userId || !hubId || !key) return;
  const vaultKey = `igs_vault_${userId}`;
  
  // Pega o cofre atual ou cria um novo
  const existingVault = JSON.parse(localStorage.getItem(vaultKey) || '{}');
  existingVault[hubId] = key;
  
  localStorage.setItem(vaultKey, JSON.stringify(existingVault));
};

// Busca a chave de um hub no cofre
export const getKeyFromVault = (userId, hubId) => {
  if (!userId || !hubId) return null;
  const vaultKey = `igs_vault_${userId}`;
  const vault = JSON.parse(localStorage.getItem(vaultKey) || '{}');
  return vault[hubId] || null;
};