/**
 * 4 Messenger - Signal Protocol E2EE
 * 
 * Главный экспорт модуля шифрования
 */

// Protocol functions (main API)
export {
  initialize,
  isInitialized,
  lock,
  getKeyBundle,
  createSession,
  encryptMessage,
  decryptMessage,
  hasSession,
  deleteSession,
  getIdentityPublicKey,
  changePassword,
  exportKeys,
  importKeys,
} from './protocol';

export type { KeyBundle, EncryptedMessage } from './protocol';

// Key store functions
export {
  keyStoreExists,
  createKeyStore,
  unlockKeyStore,
  lockKeyStore,
  isKeyStoreUnlocked,
  clearKeyStore,
  saveChatKey,
  loadChatKey,
  removeChatKey,
} from './keyStore';

// Crypto utilities
export {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToArrayBuffer,
  arrayBufferToString,
  generateAESKey,
  exportAESKey,
  importAESKey,
  aesEncrypt,
  aesDecrypt,
} from './crypto';
