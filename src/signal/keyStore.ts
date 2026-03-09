/**
 * 4 Messenger - Secure Key Storage (IndexedDB + Password Protection)
 * 
 * Хранение ключей Signal Protocol в IndexedDB с защитой паролем
 */

import { openDB, IDBPDatabase } from 'idb';
import {
  encryptWithPassword,
  decryptWithPassword,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from './crypto';

const DB_NAME = '4messenger-keystore';
const DB_VERSION = 1;

// Типы данных
export interface IdentityKeyPair {
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
}

export interface SignedPreKey {
  keyId: number;
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
  signature: ArrayBuffer;
  timestamp: number;
}

export interface PreKey {
  keyId: number;
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
}

export interface SessionKey {
  recipientId: string;
  deviceId: number;
  sessionData: ArrayBuffer;
}

export interface ChatKeyData {
  chatId: string;
  key: ArrayBuffer;
  createdAt: number;
}

interface EncryptedData {
  data: string; // base64
  salt: string; // base64
  iv: string;   // base64
}

// Singleton instance
let db: IDBPDatabase | null = null;
let currentPassword: string | null = null;

/**
 * Инициализация базы данных
 */
async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;
  
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Identity keys (long-term)
      if (!database.objectStoreNames.contains('identityKeys')) {
        database.createObjectStore('identityKeys', { keyPath: 'id' });
      }
      
      // Signed pre-keys
      if (!database.objectStoreNames.contains('signedPreKeys')) {
        database.createObjectStore('signedPreKeys', { keyPath: 'keyId' });
      }
      
      // One-time pre-keys
      if (!database.objectStoreNames.contains('preKeys')) {
        database.createObjectStore('preKeys', { keyPath: 'keyId' });
      }
      
      // Session keys (для каждого собеседника)
      if (!database.objectStoreNames.contains('sessions')) {
        database.createObjectStore('sessions', { keyPath: 'recipientId' });
      }
      
      // Chat keys (групповые ключи)
      if (!database.objectStoreNames.contains('chatKeys')) {
        database.createObjectStore('chatKeys', { keyPath: 'chatId' });
      }
      
      // Metadata (для проверки пароля)
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'id' });
      }
    },
  });
  
  return db;
}

/**
 * Шифрование данных для хранения
 */
async function encryptData(data: ArrayBuffer, password: string): Promise<EncryptedData> {
  const { encrypted, salt, iv } = await encryptWithPassword(data, password);
  return {
    data: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

/**
 * Расшифрование данных из хранилища
 */
async function decryptData(encryptedData: EncryptedData, password: string): Promise<ArrayBuffer> {
  const encrypted = base64ToArrayBuffer(encryptedData.data);
  const salt = new Uint8Array(base64ToArrayBuffer(encryptedData.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedData.iv));
  
  return await decryptWithPassword(encrypted, password, salt, iv);
}

/**
 * Проверка существования хранилища ключей
 */
export async function keyStoreExists(): Promise<boolean> {
  const database = await initDB();
  const metadata = await database.get('metadata', 'passwordCheck');
  return !!metadata;
}

/**
 * Создание нового хранилища с паролем
 */
export async function createKeyStore(password: string): Promise<void> {
  const database = await initDB();
  
  // Создаем проверочную запись для верификации пароля
  const checkData = new TextEncoder().encode('4messenger-password-check');
  const encrypted = await encryptData(checkData.buffer as ArrayBuffer, password);
  
  await database.put('metadata', {
    id: 'passwordCheck',
    ...encrypted,
  });
  
  currentPassword = password;
}

/**
 * Разблокировка хранилища паролем
 */
export async function unlockKeyStore(password: string): Promise<boolean> {
  const database = await initDB();
  
  const metadata = await database.get('metadata', 'passwordCheck');
  if (!metadata) {
    throw new Error('Key store not initialized');
  }
  
  try {
    const decrypted = await decryptData(metadata, password);
    const checkText = new TextDecoder().decode(decrypted);
    
    if (checkText === '4messenger-password-check') {
      currentPassword = password;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Блокировка хранилища (очистка пароля из памяти)
 */
export function lockKeyStore(): void {
  currentPassword = null;
}

/**
 * Проверка, разблокировано ли хранилище
 */
export function isKeyStoreUnlocked(): boolean {
  return currentPassword !== null;
}

/**
 * Смена пароля хранилища
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  if (!await unlockKeyStore(oldPassword)) {
    return false;
  }
  
  const database = await initDB();
  
  // Перешифровываем все данные
  const stores = ['identityKeys', 'signedPreKeys', 'preKeys', 'sessions', 'chatKeys'];
  
  for (const storeName of stores) {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const allItems = await store.getAll();
    
    for (const item of allItems) {
      if (item.encrypted) {
        // Расшифровываем старым паролем
        const decrypted = await decryptData(item.encrypted, oldPassword);
        // Шифруем новым паролем
        const reencrypted = await encryptData(decrypted, newPassword);
        item.encrypted = reencrypted;
        await store.put(item);
      }
    }
    
    await tx.done;
  }
  
  // Обновляем проверочную запись
  const checkData = new TextEncoder().encode('4messenger-password-check');
  const encrypted = await encryptData(checkData.buffer as ArrayBuffer, newPassword);
  await database.put('metadata', {
    id: 'passwordCheck',
    ...encrypted,
  });
  
  currentPassword = newPassword;
  return true;
}

// ==================== Identity Keys ====================

/**
 * Сохранение Identity Key Pair
 */
export async function saveIdentityKeyPair(keyPair: IdentityKeyPair): Promise<void> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const combined = concatArrayBuffers(keyPair.publicKey, keyPair.privateKey);
  const encrypted = await encryptData(combined, currentPassword);
  
  await database.put('identityKeys', {
    id: 'local',
    publicKeyLength: keyPair.publicKey.byteLength,
    encrypted,
  });
}

/**
 * Загрузка Identity Key Pair
 */
export async function loadIdentityKeyPair(): Promise<IdentityKeyPair | null> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const record = await database.get('identityKeys', 'local');
  
  if (!record) return null;
  
  const decrypted = await decryptData(record.encrypted, currentPassword);
  const publicKey = decrypted.slice(0, record.publicKeyLength);
  const privateKey = decrypted.slice(record.publicKeyLength);
  
  return { publicKey, privateKey };
}

/**
 * Сохранение публичного ключа собеседника
 */
export async function saveIdentityKey(userId: string, publicKey: ArrayBuffer): Promise<void> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const encrypted = await encryptData(publicKey, currentPassword);
  
  await database.put('identityKeys', {
    id: `remote:${userId}`,
    encrypted,
  });
}

/**
 * Загрузка публичного ключа собеседника
 */
export async function loadIdentityKey(userId: string): Promise<ArrayBuffer | null> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const record = await database.get('identityKeys', `remote:${userId}`);
  
  if (!record) return null;
  
  return await decryptData(record.encrypted, currentPassword);
}

// ==================== Signed Pre-Keys ====================

/**
 * Сохранение Signed Pre-Key
 */
export async function saveSignedPreKey(preKey: SignedPreKey): Promise<void> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  
  const combined = concatArrayBuffers(
    preKey.publicKey,
    preKey.privateKey,
    preKey.signature
  );
  const encrypted = await encryptData(combined, currentPassword);
  
  await database.put('signedPreKeys', {
    keyId: preKey.keyId,
    publicKeyLength: preKey.publicKey.byteLength,
    privateKeyLength: preKey.privateKey.byteLength,
    timestamp: preKey.timestamp,
    encrypted,
  });
}

/**
 * Загрузка Signed Pre-Key
 */
export async function loadSignedPreKey(keyId: number): Promise<SignedPreKey | null> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const record = await database.get('signedPreKeys', keyId);
  
  if (!record) return null;
  
  const decrypted = await decryptData(record.encrypted, currentPassword);
  
  let offset = 0;
  const publicKey = decrypted.slice(offset, offset + record.publicKeyLength);
  offset += record.publicKeyLength;
  const privateKey = decrypted.slice(offset, offset + record.privateKeyLength);
  offset += record.privateKeyLength;
  const signature = decrypted.slice(offset);
  
  return {
    keyId: record.keyId,
    publicKey,
    privateKey,
    signature,
    timestamp: record.timestamp,
  };
}

// ==================== Pre-Keys ====================

/**
 * Сохранение Pre-Key
 */
export async function savePreKey(preKey: PreKey): Promise<void> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  
  const combined = concatArrayBuffers(preKey.publicKey, preKey.privateKey);
  const encrypted = await encryptData(combined, currentPassword);
  
  await database.put('preKeys', {
    keyId: preKey.keyId,
    publicKeyLength: preKey.publicKey.byteLength,
    encrypted,
  });
}

/**
 * Загрузка Pre-Key
 */
export async function loadPreKey(keyId: number): Promise<PreKey | null> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const record = await database.get('preKeys', keyId);
  
  if (!record) return null;
  
  const decrypted = await decryptData(record.encrypted, currentPassword);
  const publicKey = decrypted.slice(0, record.publicKeyLength);
  const privateKey = decrypted.slice(record.publicKeyLength);
  
  return {
    keyId: record.keyId,
    publicKey,
    privateKey,
  };
}

/**
 * Удаление использованного Pre-Key
 */
export async function removePreKey(keyId: number): Promise<void> {
  const database = await initDB();
  await database.delete('preKeys', keyId);
}

/**
 * Получение количества доступных Pre-Keys
 */
export async function getPreKeyCount(): Promise<number> {
  const database = await initDB();
  return await database.count('preKeys');
}

// ==================== Sessions ====================

/**
 * Сохранение сессии
 */
export async function saveSession(recipientId: string, sessionData: ArrayBuffer): Promise<void> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const encrypted = await encryptData(sessionData, currentPassword);
  
  await database.put('sessions', {
    recipientId,
    encrypted,
    updatedAt: Date.now(),
  });
}

/**
 * Загрузка сессии
 */
export async function loadSession(recipientId: string): Promise<ArrayBuffer | null> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const record = await database.get('sessions', recipientId);
  
  if (!record) return null;
  
  return await decryptData(record.encrypted, currentPassword);
}

/**
 * Удаление сессии
 */
export async function removeSession(recipientId: string): Promise<void> {
  const database = await initDB();
  await database.delete('sessions', recipientId);
}

// ==================== Chat Keys ====================

/**
 * Сохранение ключа чата (для групп)
 */
export async function saveChatKey(chatId: string, key: ArrayBuffer): Promise<void> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const encrypted = await encryptData(key, currentPassword);
  
  await database.put('chatKeys', {
    chatId,
    encrypted,
    createdAt: Date.now(),
  });
}

/**
 * Загрузка ключа чата
 */
export async function loadChatKey(chatId: string): Promise<ArrayBuffer | null> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  const record = await database.get('chatKeys', chatId);
  
  if (!record) return null;
  
  return await decryptData(record.encrypted, currentPassword);
}

/**
 * Удаление ключа чата
 */
export async function removeChatKey(chatId: string): Promise<void> {
  const database = await initDB();
  await database.delete('chatKeys', chatId);
}

// ==================== Utilities ====================

/**
 * Очистка всего хранилища
 */
export async function clearKeyStore(): Promise<void> {
  const database = await initDB();
  
  const stores = ['identityKeys', 'signedPreKeys', 'preKeys', 'sessions', 'chatKeys', 'metadata'];
  
  for (const storeName of stores) {
    await database.clear(storeName);
  }
  
  currentPassword = null;
}

/**
 * Экспорт всех ключей (зашифрованный бэкап)
 */
export async function exportKeys(): Promise<string> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const database = await initDB();
  
  const exportData: Record<string, unknown[]> = {};
  const stores = ['identityKeys', 'signedPreKeys', 'preKeys', 'sessions', 'chatKeys'];
  
  for (const storeName of stores) {
    exportData[storeName] = await database.getAll(storeName);
  }
  
  return JSON.stringify(exportData);
}

/**
 * Импорт ключей из бэкапа
 */
export async function importKeys(backupJson: string): Promise<void> {
  const database = await initDB();
  const importData = JSON.parse(backupJson);
  
  for (const [storeName, items] of Object.entries(importData)) {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    for (const item of items as unknown[]) {
      await store.put(item);
    }
    
    await tx.done;
  }
}

// Вспомогательная функция для конкатенации буферов
function concatArrayBuffers(...buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return result.buffer as ArrayBuffer;
}
