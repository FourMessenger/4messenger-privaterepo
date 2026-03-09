/**
 * 4 Messenger - True End-to-End Encryption with Password Protection
 * 
 * Uses Web Crypto API for real E2EE using AES-GCM.
 * The server CANNOT decrypt any messages - it only stores ciphertext.
 * All keys are stored in IndexedDB encrypted with user's password.
 */

import { openDB, IDBPDatabase } from 'idb';

// Database constants
const DB_NAME = '4messenger-e2ee-db';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

// Initialize IndexedDB
let db: IDBPDatabase | null = null;

async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;
  
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  
  return db;
}

// Password-based encryption for key storage
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptWithPassword(data: string, password: string): Promise<{ encrypted: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);
  
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  
  return {
    encrypted: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

async function decryptWithPassword(encrypted: string, salt: string, iv: string, password: string): Promise<string> {
  const saltBytes = new Uint8Array(base64ToArrayBuffer(salt));
  const ivBytes = new Uint8Array(base64ToArrayBuffer(iv));
  const encryptedBytes = base64ToArrayBuffer(encrypted);
  
  const key = await deriveKeyFromPassword(password, saltBytes);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    encryptedBytes
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// Current password for key decryption (kept in memory)
let currentPassword: string | null = null;
let cachedKeyPair: { publicKey: string; privateKey: string } | null = null;

async function upsertVerifyAndIdentity(password: string, keyPair: { publicKey: string; privateKey: string }): Promise<void> {
  currentPassword = password;
  const database = await initDB();

  const encryptedIdentity = await encryptWithPassword(JSON.stringify(keyPair), password);
  await database.put(STORE_NAME, {
    id: 'identity',
    ...encryptedIdentity,
    createdAt: Date.now(),
  });

  const verifyToken = await encryptWithPassword('4messenger-verify', password);
  await database.put(STORE_NAME, {
    id: 'verify',
    ...verifyToken,
  });

  cachedKeyPair = keyPair;
}

/**
 * Check if key store exists
 */
async function keyStoreExists(): Promise<boolean> {
  const database = await initDB();
  const record = await database.get(STORE_NAME, 'identity');
  return !!record;
}

/**
 * Initialize key store with password
 */
async function initializeKeyStore(password: string): Promise<{ publicKey: string; privateKey: string }> {
  // Generate new key pair
  const keyPair = await generateKeyPair();

  await upsertVerifyAndIdentity(password, keyPair);
  return keyPair;
}

/**
 * Unlock key store with password
 */
async function unlockKeyStore(password: string): Promise<{ publicKey: string; privateKey: string } | null> {
  const database = await initDB();
  
  // First verify password
  const verifyRecord = await database.get(STORE_NAME, 'verify');
  if (!verifyRecord) return null;
  
  try {
    const decrypted = await decryptWithPassword(
      verifyRecord.encrypted,
      verifyRecord.salt,
      verifyRecord.iv,
      password
    );
    
    if (decrypted !== '4messenger-verify') {
      return null;
    }
  } catch {
    return null; // Wrong password
  }
  
  // Load identity keys
  const identityRecord = await database.get(STORE_NAME, 'identity');
  if (!identityRecord) return null;
  
  try {
    const decrypted = await decryptWithPassword(
      identityRecord.encrypted,
      identityRecord.salt,
      identityRecord.iv,
      password
    );
    
    currentPassword = password;
    cachedKeyPair = JSON.parse(decrypted);
    return cachedKeyPair;
  } catch {
    return null;
  }
}

/**
 * Check if unlocked
 */
function isUnlocked(): boolean {
  return currentPassword !== null && cachedKeyPair !== null;
}

/**
 * Lock key store
 */
function lockKeyStore(): void {
  currentPassword = null;
  cachedKeyPair = null;
}

/**
 * Get current key pair (must be unlocked)
 */
function getKeyPair(): { publicKey: string; privateKey: string } | null {
  return cachedKeyPair;
}

/**
 * Import legacy keyPair (previously stored in localStorage) into the password-protected keystore.
 *
 * This avoids breaking existing installs that already have wrapped chat keys/messages.
 */
async function importLegacyKeyPair(password: string, legacy: { publicKey: string; privateKey: string }): Promise<boolean> {
  try {
    if (!legacy?.publicKey || !legacy?.privateKey) return false;
    await upsertVerifyAndIdentity(password, legacy);
    return true;
  } catch {
    return false;
  }
}

/**
 * Change password
 */
async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  // First verify old password
  const keyPair = await unlockKeyStore(oldPassword);
  if (!keyPair) return false;
  
  const database = await initDB();
  
  // Re-encrypt identity keys with new password
  const encryptedIdentity = await encryptWithPassword(JSON.stringify(keyPair), newPassword);
  await database.put(STORE_NAME, {
    id: 'identity',
    ...encryptedIdentity,
    createdAt: Date.now(),
  });
  
  // Re-encrypt chat keys
  const allRecords = await database.getAll(STORE_NAME);
  for (const record of allRecords) {
    if (record.id.startsWith('chat:')) {
      try {
        const decrypted = await decryptWithPassword(
          record.encrypted,
          record.salt,
          record.iv,
          oldPassword
        );
        const reEncrypted = await encryptWithPassword(decrypted, newPassword);
        await database.put(STORE_NAME, {
          id: record.id,
          ...reEncrypted,
        });
      } catch {
        // Skip if can't decrypt
      }
    }
  }
  
  // Update verification token
  const verifyToken = await encryptWithPassword('4messenger-verify', newPassword);
  await database.put(STORE_NAME, {
    id: 'verify',
    ...verifyToken,
  });
  
  currentPassword = newPassword;
  return true;
}

/**
 * Save chat key (encrypted with password)
 */
async function saveChatKey(chatId: string, chatKey: CryptoKey): Promise<void> {
  if (!currentPassword) throw new Error('Key store is locked');
  
  const rawKey = await crypto.subtle.exportKey('raw', chatKey);
  const keyBase64 = arrayBufferToBase64(rawKey);
  
  const encrypted = await encryptWithPassword(keyBase64, currentPassword);
  
  const database = await initDB();
  await database.put(STORE_NAME, {
    id: `chat:${chatId}`,
    ...encrypted,
    createdAt: Date.now(),
  });
}

/**
 * Load chat key
 */
async function loadChatKey(chatId: string): Promise<CryptoKey | null> {
  if (!currentPassword) return null;
  
  const database = await initDB();
  const record = await database.get(STORE_NAME, `chat:${chatId}`);
  
  if (!record) return null;
  
  try {
    const decrypted = await decryptWithPassword(
      record.encrypted,
      record.salt,
      record.iv,
      currentPassword
    );
    
    const keyBytes = base64ToArrayBuffer(decrypted);
    return await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } catch {
    return null;
  }
}

/**
 * Generate a new identity key pair (RSA-OAEP for key wrapping)
 */
async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['wrapKey', 'unwrapKey']
  );

  const publicKeyData = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyData = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKeyData),
    privateKey: arrayBufferToBase64(privateKeyData),
  };
}

/**
 * Generate a random AES-GCM chat key (for encrypting messages)
 */
async function generateChatKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Import a public key from Base64 string
 */
async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(publicKeyBase64);
  return await crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['wrapKey']
  );
}

/**
 * Import a private key from Base64 string
 */
async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(privateKeyBase64);
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['unwrapKey']
  );
}

/**
 * Wrap (encrypt) a chat key with a user's public key
 */
async function wrapKey(chatKey: CryptoKey, publicKeyBase64: string): Promise<string | null> {
  try {
    const publicKey = await importPublicKey(publicKeyBase64);
    const wrapped = await crypto.subtle.wrapKey('raw', chatKey, publicKey, { name: 'RSA-OAEP' });
    return arrayBufferToBase64(wrapped);
  } catch (e) {
    console.error('[E2EE] Failed to wrap key:', e);
    return null;
  }
}

/**
 * Unwrap (decrypt) a chat key with user's private key
 */
async function unwrapKey(wrappedKeyBase64: string, privateKeyBase64: string): Promise<CryptoKey | null> {
  try {
    const privateKey = await importPrivateKey(privateKeyBase64);
    const wrappedKey = base64ToArrayBuffer(wrappedKeyBase64);
    return await crypto.subtle.unwrapKey(
      'raw',
      wrappedKey,
      privateKey,
      { name: 'RSA-OAEP' },
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (e) {
    console.error('[E2EE] Failed to unwrap key:', e);
    return null;
  }
}

/**
 * Encrypt a message using AES-GCM
 */
async function encryptMessage(plaintext: string, chatKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    chatKey,
    data
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return 'e2ee:' + arrayBufferToBase64(combined.buffer as ArrayBuffer);
}

/**
 * Decrypt a message using AES-GCM
 */
async function decryptMessage(ciphertext: string, chatKey: CryptoKey): Promise<string> {
  try {
    if (!ciphertext.startsWith('e2ee:')) {
      return ciphertext;
    }

    const base64Data = ciphertext.slice(5);
    const combined = new Uint8Array(base64ToArrayBuffer(base64Data));

    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      chatKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (e) {
    console.error('[E2EE] Failed to decrypt message:', e);
    return '[Decryption failed]';
  }
}

/**
 * Check if a message is E2EE encrypted
 */
function isEncrypted(content: string): boolean {
  return content.startsWith('e2ee:');
}

/**
 * Clear all stored keys
 */
async function clearKeys(): Promise<void> {
  const database = await initDB();
  await database.clear(STORE_NAME);
  currentPassword = null;
  cachedKeyPair = null;
}

/**
 * Export keys backup (encrypted)
 */
async function exportKeysBackup(): Promise<string | null> {
  if (!currentPassword) return null;
  
  const database = await initDB();
  const allRecords = await database.getAll(STORE_NAME);
  return JSON.stringify(allRecords);
}

/**
 * Import keys backup
 */
async function importKeysBackup(backupJson: string): Promise<boolean> {
  try {
    const records = JSON.parse(backupJson);
    const database = await initDB();
    
    for (const record of records) {
      await database.put(STORE_NAME, record);
    }
    
    return true;
  } catch {
    return false;
  }
}

// Export as E2EE namespace
export const E2EE = {
  // Key store management
  keyStoreExists,
  initializeKeyStore,
  unlockKeyStore,
  isUnlocked,
  lockKeyStore,
  getKeyPair,
  importLegacyKeyPair,
  changePassword,
  
  // Chat key management
  saveChatKey,
  loadChatKey,
  
  // Key generation
  generateKeyPair,
  generateChatKey,
  
  // Key wrapping
  wrapKey,
  unwrapKey,
  
  // Message encryption
  encryptMessage,
  decryptMessage,
  isEncrypted,
  
  // Utilities
  clearKeys,
  exportKeysBackup,
  importKeysBackup,
  importPublicKey,
  importPrivateKey,
};

export default E2EE;
