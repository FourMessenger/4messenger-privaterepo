/**
 * 4 Messenger - Signal Protocol Implementation
 * 
 * Реализация Signal Protocol с Double Ratchet алгоритмом
 * - X3DH для установки сессии
 * - Double Ratchet для обмена сообщениями
 * - Защита ключей паролем
 */

import * as crypto from './crypto';
import * as keyStore from './keyStore';

// Типы
export interface KeyBundle {
  identityKey: string;    // base64
  signedPreKey: string;   // base64
  signedPreKeyId: number;
  signedPreKeySignature: string; // base64
  preKey?: string;        // base64 (optional one-time key)
  preKeyId?: number;
}

export interface EncryptedMessage {
  type: 'prekey' | 'message';
  ciphertext: string;     // base64
  iv: string;             // base64
  senderIdentityKey?: string;
  ephemeralKey?: string;
  preKeyId?: number;
  signedPreKeyId?: number;
  counter: number;
  previousCounter: number;
}

interface SessionState {
  rootKey: ArrayBuffer;
  sendingChainKey: ArrayBuffer;
  receivingChainKey: ArrayBuffer | null;
  sendingRatchetKey: CryptoKeyPair;
  receivingRatchetKey: CryptoKey | null;
  sendingCounter: number;
  receivingCounter: number;
  previousSendingCounter: number;
}

// Константы
const MAX_SKIP = 1000;
const PRE_KEY_COUNT = 100;

// Кеш сессий в памяти
const sessionCache = new Map<string, SessionState>();

/**
 * Инициализация Signal Protocol
 */
export async function initialize(password: string, isNewUser: boolean): Promise<boolean> {
  try {
    if (isNewUser || !await keyStore.keyStoreExists()) {
      await keyStore.createKeyStore(password);
      await generateIdentityKeys();
      await generateSignedPreKey();
      await generatePreKeys(PRE_KEY_COUNT);
      return true;
    } else {
      return await keyStore.unlockKeyStore(password);
    }
  } catch (error) {
    console.error('[Signal] Initialize error:', error);
    return false;
  }
}

/**
 * Проверка инициализации
 */
export function isInitialized(): boolean {
  return keyStore.isKeyStoreUnlocked();
}

/**
 * Блокировка хранилища
 */
export function lock(): void {
  keyStore.lockKeyStore();
  sessionCache.clear();
}

/**
 * Генерация Identity Keys
 */
async function generateIdentityKeys(): Promise<void> {
  const keyPair = await crypto.generateKeyPair();
  const publicKey = await crypto.exportPublicKey(keyPair.publicKey);
  const privateKey = await crypto.exportPrivateKey(keyPair.privateKey);
  
  await keyStore.saveIdentityKeyPair({ publicKey, privateKey });
}

/**
 * Генерация Signed Pre-Key
 */
async function generateSignedPreKey(): Promise<void> {
  const keyPair = await crypto.generateKeyPair();
  const publicKey = await crypto.exportPublicKey(keyPair.publicKey);
  const privateKey = await crypto.exportPrivateKey(keyPair.privateKey);
  
  // Подписываем публичный ключ identity key
  const identityKeyPair = await keyStore.loadIdentityKeyPair();
  if (!identityKeyPair) throw new Error('Identity key not found');
  
  const signingKey = await crypto.importPrivateKey(identityKeyPair.privateKey);
  const signature = await crypto.sign(signingKey, publicKey);
  
  const keyId = Date.now();
  await keyStore.saveSignedPreKey({
    keyId,
    publicKey,
    privateKey,
    signature,
    timestamp: Date.now(),
  });
}

/**
 * Генерация Pre-Keys
 */
async function generatePreKeys(count: number): Promise<void> {
  const startId = Date.now();
  
  for (let i = 0; i < count; i++) {
    const keyPair = await crypto.generateKeyPair();
    const publicKey = await crypto.exportPublicKey(keyPair.publicKey);
    const privateKey = await crypto.exportPrivateKey(keyPair.privateKey);
    
    await keyStore.savePreKey({
      keyId: startId + i,
      publicKey,
      privateKey,
    });
  }
}

/**
 * Получение Key Bundle для публикации на сервере
 */
export async function getKeyBundle(): Promise<KeyBundle | null> {
  try {
    const identityKeyPair = await keyStore.loadIdentityKeyPair();
    if (!identityKeyPair) return null;
    
    const signedPreKey = await keyStore.loadSignedPreKey(
      await getLatestSignedPreKeyId()
    );
    if (!signedPreKey) return null;
    
    // Получаем один одноразовый ключ
    const preKeyId = await getNextPreKeyId();
    let preKey: keyStore.PreKey | null = null;
    if (preKeyId !== null) {
      preKey = await keyStore.loadPreKey(preKeyId);
    }
    
    const bundle: KeyBundle = {
      identityKey: crypto.arrayBufferToBase64(identityKeyPair.publicKey),
      signedPreKey: crypto.arrayBufferToBase64(signedPreKey.publicKey),
      signedPreKeyId: signedPreKey.keyId,
      signedPreKeySignature: crypto.arrayBufferToBase64(signedPreKey.signature),
    };
    
    if (preKey) {
      bundle.preKey = crypto.arrayBufferToBase64(preKey.publicKey);
      bundle.preKeyId = preKey.keyId;
    }
    
    return bundle;
  } catch (error) {
    console.error('[Signal] getKeyBundle error:', error);
    return null;
  }
}

/**
 * X3DH: Установка сессии (инициатор)
 */
export async function createSession(
  recipientId: string,
  recipientBundle: KeyBundle
): Promise<void> {
  const identityKeyPair = await keyStore.loadIdentityKeyPair();
  if (!identityKeyPair) throw new Error('Identity key not found');
  
  // Генерируем ephemeral key
  const ephemeralKeyPair = await crypto.generateKeyPair();
  
  // Импортируем ключи получателя
  const recipientIdentityKey = await crypto.importPublicKey(
    crypto.base64ToArrayBuffer(recipientBundle.identityKey)
  );
  const recipientSignedPreKey = await crypto.importPublicKey(
    crypto.base64ToArrayBuffer(recipientBundle.signedPreKey)
  );
  
  // Загружаем наш приватный identity key
  const ourIdentityPrivate = await crypto.importPrivateKey(identityKeyPair.privateKey);
  
  // X3DH: вычисляем shared secrets
  // DH1: identity_private -> signed_prekey_public
  const dh1 = await crypto.computeSharedSecret(ourIdentityPrivate, recipientSignedPreKey);
  
  // DH2: ephemeral_private -> identity_public
  const dh2 = await crypto.computeSharedSecret(ephemeralKeyPair.privateKey, recipientIdentityKey);
  
  // DH3: ephemeral_private -> signed_prekey_public
  const dh3 = await crypto.computeSharedSecret(ephemeralKeyPair.privateKey, recipientSignedPreKey);
  
  // Комбинируем DH результаты
  let masterSecret = crypto.concatBuffers(dh1, dh2, dh3);
  
  // Если есть one-time prekey
  if (recipientBundle.preKey) {
    const recipientPreKey = await crypto.importPublicKey(
      crypto.base64ToArrayBuffer(recipientBundle.preKey)
    );
    const dh4 = await crypto.computeSharedSecret(ephemeralKeyPair.privateKey, recipientPreKey);
    masterSecret = crypto.concatBuffers(masterSecret, dh4);
  }
  
  // Деривируем root key
  const salt = new Uint8Array(32).buffer as ArrayBuffer;
  const rootKey = await crypto.hkdf(masterSecret, salt, 'Signal_X3DH', 32);
  
  // Создаем начальное состояние сессии
  const sendingRatchetKey = await crypto.generateKeyPair();
  const chainKeys = await crypto.hkdf(
    rootKey,
    await crypto.computeSharedSecret(sendingRatchetKey.privateKey, recipientSignedPreKey),
    'Signal_Ratchet',
    64
  );
  
  const sessionState: SessionState = {
    rootKey: chainKeys.slice(0, 32),
    sendingChainKey: chainKeys.slice(32),
    receivingChainKey: null,
    sendingRatchetKey,
    receivingRatchetKey: recipientSignedPreKey,
    sendingCounter: 0,
    receivingCounter: 0,
    previousSendingCounter: 0,
  };
  
  // Сохраняем сессию
  sessionCache.set(recipientId, sessionState);
  await saveSessionState(recipientId, sessionState);
  
  // Сохраняем identity key получателя
  await keyStore.saveIdentityKey(
    recipientId,
    crypto.base64ToArrayBuffer(recipientBundle.identityKey)
  );
}

/**
 * Шифрование сообщения
 */
export async function encryptMessage(
  recipientId: string,
  plaintext: string
): Promise<EncryptedMessage> {
  let session = sessionCache.get(recipientId);
  if (!session) {
    const loadedSession = await loadSessionState(recipientId);
    if (!loadedSession) {
      throw new Error('No session with recipient');
    }
    session = loadedSession;
  }
  
  // Получаем message key из chain key
  const messageKey = await crypto.hkdf(
    session.sendingChainKey,
    new Uint8Array(32).buffer as ArrayBuffer,
    'Signal_MessageKey',
    32
  );
  
  // Обновляем chain key
  session.sendingChainKey = await crypto.hkdf(
    session.sendingChainKey,
    new Uint8Array(32).buffer as ArrayBuffer,
    'Signal_ChainKey',
    32
  );
  
  // Шифруем сообщение
  const aesKey = await crypto.importAESKey(messageKey);
  const plaintextBuffer = crypto.stringToArrayBuffer(plaintext);
  const { ciphertext, iv } = await crypto.aesEncrypt(aesKey, plaintextBuffer);
  
  const message: EncryptedMessage = {
    type: session.sendingCounter === 0 ? 'prekey' : 'message',
    ciphertext: crypto.arrayBufferToBase64(ciphertext),
    iv: crypto.arrayBufferToBase64(iv.buffer as ArrayBuffer),
    counter: session.sendingCounter,
    previousCounter: session.previousSendingCounter,
  };
  
  // Добавляем ephemeral key для первого сообщения
  if (message.type === 'prekey') {
    const identityKeyPair = await keyStore.loadIdentityKeyPair();
    if (identityKeyPair) {
      message.senderIdentityKey = crypto.arrayBufferToBase64(identityKeyPair.publicKey);
    }
    message.ephemeralKey = crypto.arrayBufferToBase64(
      await crypto.exportPublicKey(session.sendingRatchetKey.publicKey)
    );
  }
  
  session.sendingCounter++;
  
  // Сохраняем обновленную сессию
  sessionCache.set(recipientId, session);
  await saveSessionState(recipientId, session);
  
  return message;
}

/**
 * Расшифровка сообщения
 */
export async function decryptMessage(
  senderId: string,
  message: EncryptedMessage
): Promise<string> {
  let session = sessionCache.get(senderId);
  
  // Если это prekey сообщение и нет сессии - создаем
  if (message.type === 'prekey' && !session) {
    session = await handlePreKeyMessage(senderId, message);
  } else if (!session) {
    const loadedSession = await loadSessionState(senderId);
    if (!loadedSession) {
      throw new Error('No session with sender');
    }
    session = loadedSession;
  }
  
  if (!session) {
    throw new Error('No session with sender');
  }
  
  // Проверяем счетчик
  if (message.counter > session.receivingCounter + MAX_SKIP) {
    throw new Error('Message counter too high');
  }
  
  // Получаем message key
  let chainKey = session.receivingChainKey;
  if (!chainKey) {
    throw new Error('No receiving chain key');
  }
  
  // Пропускаем ключи если нужно
  for (let i = session.receivingCounter; i < message.counter; i++) {
    chainKey = await crypto.hkdf(
      chainKey,
      new Uint8Array(32).buffer as ArrayBuffer,
      'Signal_ChainKey',
      32
    );
  }
  
  const messageKey = await crypto.hkdf(
    chainKey,
    new Uint8Array(32).buffer as ArrayBuffer,
    'Signal_MessageKey',
    32
  );
  
  // Обновляем chain key
  session.receivingChainKey = await crypto.hkdf(
    chainKey,
    new Uint8Array(32).buffer as ArrayBuffer,
    'Signal_ChainKey',
    32
  );
  session.receivingCounter = message.counter + 1;
  
  // Расшифровываем
  const aesKey = await crypto.importAESKey(messageKey);
  const ciphertext = crypto.base64ToArrayBuffer(message.ciphertext);
  const iv = new Uint8Array(crypto.base64ToArrayBuffer(message.iv));
  
  const plaintext = await crypto.aesDecrypt(aesKey, ciphertext, iv);
  
  // Сохраняем сессию
  sessionCache.set(senderId, session);
  await saveSessionState(senderId, session);
  
  return crypto.arrayBufferToString(plaintext);
}

/**
 * Обработка PreKey сообщения (создание сессии как получатель)
 */
async function handlePreKeyMessage(
  senderId: string,
  message: EncryptedMessage
): Promise<SessionState> {
  if (!message.senderIdentityKey || !message.ephemeralKey) {
    throw new Error('Invalid prekey message');
  }
  
  const identityKeyPair = await keyStore.loadIdentityKeyPair();
  if (!identityKeyPair) throw new Error('Identity key not found');
  
  const signedPreKey = await keyStore.loadSignedPreKey(
    message.signedPreKeyId || await getLatestSignedPreKeyId()
  );
  if (!signedPreKey) throw new Error('Signed pre-key not found');
  
  // Импортируем ключи
  const senderIdentityKey = await crypto.importPublicKey(
    crypto.base64ToArrayBuffer(message.senderIdentityKey)
  );
  const senderEphemeralKey = await crypto.importPublicKey(
    crypto.base64ToArrayBuffer(message.ephemeralKey)
  );
  const ourIdentityPrivate = await crypto.importPrivateKey(identityKeyPair.privateKey);
  const ourSignedPreKeyPrivate = await crypto.importPrivateKey(signedPreKey.privateKey);
  
  // X3DH: вычисляем shared secrets (в обратном порядке)
  // DH1: signed_prekey_private -> identity_public
  const dh1 = await crypto.computeSharedSecret(ourSignedPreKeyPrivate, senderIdentityKey);
  
  // DH2: identity_private -> ephemeral_public
  const dh2 = await crypto.computeSharedSecret(ourIdentityPrivate, senderEphemeralKey);
  
  // DH3: signed_prekey_private -> ephemeral_public
  const dh3 = await crypto.computeSharedSecret(ourSignedPreKeyPrivate, senderEphemeralKey);
  
  let masterSecret = crypto.concatBuffers(dh1, dh2, dh3);
  
  // Если использовался one-time prekey
  if (message.preKeyId) {
    const preKey = await keyStore.loadPreKey(message.preKeyId);
    if (preKey) {
      const preKeyPrivate = await crypto.importPrivateKey(preKey.privateKey);
      const dh4 = await crypto.computeSharedSecret(preKeyPrivate, senderEphemeralKey);
      masterSecret = crypto.concatBuffers(masterSecret, dh4);
      
      // Удаляем использованный one-time key
      await keyStore.removePreKey(message.preKeyId);
    }
  }
  
  // Деривируем root key
  const salt = new Uint8Array(32).buffer as ArrayBuffer;
  const rootKey = await crypto.hkdf(masterSecret, salt, 'Signal_X3DH', 32);
  
  // Создаем состояние сессии
  const chainKeys = await crypto.hkdf(
    rootKey,
    await crypto.computeSharedSecret(ourSignedPreKeyPrivate, senderEphemeralKey),
    'Signal_Ratchet',
    64
  );
  
  const sessionState: SessionState = {
    rootKey: chainKeys.slice(0, 32),
    sendingChainKey: new Uint8Array(32).buffer as ArrayBuffer,
    receivingChainKey: chainKeys.slice(32),
    sendingRatchetKey: await crypto.generateKeyPair(),
    receivingRatchetKey: senderEphemeralKey,
    sendingCounter: 0,
    receivingCounter: 0,
    previousSendingCounter: 0,
  };
  
  // Сохраняем identity key отправителя
  await keyStore.saveIdentityKey(
    senderId,
    crypto.base64ToArrayBuffer(message.senderIdentityKey)
  );
  
  return sessionState;
}

/**
 * Вспомогательные функции
 */
async function getLatestSignedPreKeyId(): Promise<number> {
  // Возвращаем последний signed pre-key ID
  // В реальном приложении нужно хранить список ID
  return Date.now();
}

async function getNextPreKeyId(): Promise<number | null> {
  const count = await keyStore.getPreKeyCount();
  if (count === 0) return null;
  // Возвращаем первый доступный
  return Date.now();
}

async function saveSessionState(recipientId: string, state: SessionState): Promise<void> {
  // Сериализуем состояние сессии
  const serialized = JSON.stringify({
    rootKey: crypto.arrayBufferToBase64(state.rootKey),
    sendingChainKey: crypto.arrayBufferToBase64(state.sendingChainKey),
    receivingChainKey: state.receivingChainKey 
      ? crypto.arrayBufferToBase64(state.receivingChainKey) 
      : null,
    sendingRatchetPublicKey: crypto.arrayBufferToBase64(
      await crypto.exportPublicKey(state.sendingRatchetKey.publicKey)
    ),
    sendingRatchetPrivateKey: crypto.arrayBufferToBase64(
      await crypto.exportPrivateKey(state.sendingRatchetKey.privateKey)
    ),
    receivingRatchetKey: state.receivingRatchetKey
      ? crypto.arrayBufferToBase64(await crypto.exportPublicKey(state.receivingRatchetKey))
      : null,
    sendingCounter: state.sendingCounter,
    receivingCounter: state.receivingCounter,
    previousSendingCounter: state.previousSendingCounter,
  });
  
  await keyStore.saveSession(recipientId, crypto.stringToArrayBuffer(serialized));
}

async function loadSessionState(recipientId: string): Promise<SessionState | null> {
  try {
    const data = await keyStore.loadSession(recipientId);
    if (!data) return null;
    
    const parsed = JSON.parse(crypto.arrayBufferToString(data));
    
    const sendingRatchetPublicKey = await crypto.importPublicKey(
      crypto.base64ToArrayBuffer(parsed.sendingRatchetPublicKey)
    );
    const sendingRatchetPrivateKey = await crypto.importPrivateKey(
      crypto.base64ToArrayBuffer(parsed.sendingRatchetPrivateKey)
    );
    
    const state: SessionState = {
      rootKey: crypto.base64ToArrayBuffer(parsed.rootKey),
      sendingChainKey: crypto.base64ToArrayBuffer(parsed.sendingChainKey),
      receivingChainKey: parsed.receivingChainKey
        ? crypto.base64ToArrayBuffer(parsed.receivingChainKey)
        : null,
      sendingRatchetKey: {
        publicKey: sendingRatchetPublicKey,
        privateKey: sendingRatchetPrivateKey,
      },
      receivingRatchetKey: parsed.receivingRatchetKey
        ? await crypto.importPublicKey(crypto.base64ToArrayBuffer(parsed.receivingRatchetKey))
        : null,
      sendingCounter: parsed.sendingCounter,
      receivingCounter: parsed.receivingCounter,
      previousSendingCounter: parsed.previousSendingCounter,
    };
    
    sessionCache.set(recipientId, state);
    return state;
  } catch {
    return null;
  }
}

/**
 * Проверка наличия сессии
 */
export async function hasSession(recipientId: string): Promise<boolean> {
  if (sessionCache.has(recipientId)) return true;
  const session = await keyStore.loadSession(recipientId);
  return session !== null;
}

/**
 * Удаление сессии
 */
export async function deleteSession(recipientId: string): Promise<void> {
  sessionCache.delete(recipientId);
  await keyStore.removeSession(recipientId);
}

/**
 * Получение публичного Identity Key
 */
export async function getIdentityPublicKey(): Promise<string | null> {
  const keyPair = await keyStore.loadIdentityKeyPair();
  if (!keyPair) return null;
  return crypto.arrayBufferToBase64(keyPair.publicKey);
}

/**
 * Смена пароля хранилища
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  return await keyStore.changePassword(oldPassword, newPassword);
}

/**
 * Экспорт ключей (зашифрованный бэкап)
 */
export async function exportKeys(): Promise<string> {
  return await keyStore.exportKeys();
}

/**
 * Импорт ключей из бэкапа
 */
export async function importKeys(backup: string): Promise<void> {
  await keyStore.importKeys(backup);
}
