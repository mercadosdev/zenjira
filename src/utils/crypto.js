import CryptoJS from 'crypto-js';

// Função para criptografar um texto ou objeto JSON
export const encryptData = (data, secretKey) => {
  if (!data || !secretKey) return null;
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringData, secretKey).toString();
};

// Função para descriptografar retornando o texto ou objeto original
export const decryptData = (ciphertext, secretKey) => {
  if (!ciphertext || !secretKey) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.error("Erro ao descriptografar dados. Chave incorreta?");
    return null;
  }
};

// NOVO: Função para Hashing da Senha Mestra do Usuário
export const hashPassword = (password) => {
  if (!password) return null;
  return CryptoJS.SHA256(password).toString();
};