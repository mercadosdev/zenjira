export const saveKeyToVault = (userId, hubId, key) => {
  if (!userId || !hubId || !key) return;
  const vaultKey = `igs_vault_${userId}`;
  const existingVault = JSON.parse(localStorage.getItem(vaultKey) || '{}');
  existingVault[hubId] = key;
  localStorage.setItem(vaultKey, JSON.stringify(existingVault));
};

export const getKeyFromVault = (userId, hubId) => {
  if (!userId || !hubId) return null;
  const vaultKey = `igs_vault_${userId}`;
  const vault = JSON.parse(localStorage.getItem(vaultKey) || '{}');
  return vault[hubId] || null;
};

// NOVA FUNÇÃO: APAGA A CHAVE CORROMPIDA
export const removeKeyFromVault = (userId, hubId) => {
  if (!userId || !hubId) return;
  const vaultKey = `igs_vault_${userId}`;
  const existingVault = JSON.parse(localStorage.getItem(vaultKey) || '{}');
  delete existingVault[hubId];
  localStorage.setItem(vaultKey, JSON.stringify(existingVault));
};