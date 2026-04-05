/**
 * 4 Messenger - Simple Per-Message E2EE (WhatsApp-like)
 * 
 * Each message gets:
 * 1. A unique ephemeral AES key for message encryption
 * 2. The ephemeral key is encrypted with recipient's public key
 * 3. Both encrypted message and encrypted key are sent to server
 * 
 * This is simpler and more performant than Signal Protocol.
 */

const STORAGE_KEY = '4messenger-e2ee-keys';

export interface E2EEKeyPair {
  publicKey: string;      // base64, used to encrypt ephemeral keys
  privateKey: string;     // base64, used to decrypt ephemeral keys
}

export interface EncryptedMessagePacket {
  encryptedMessage: string;  // base64 - the actual message encrypted with ephemeral key
  encryptedEphemeralKey: string; // base64 - ephemeral key encrypted with recipient's public key
  ephemeralKeyIv: string;    // base64 - IV for ephemeral key encryption (ECDH shared secret based)
  messageIv: string;         // base64 - IV for message encryption
}

class SimpleE2EE {
  private keyPair: E2EEKeyPair | null = null;
  private recipientPublicKeys: Map<string, string> = new Map(); // userId -> public key (base64)
  private chatKeys: Map<string, CryptoKey> = new Map(); // chatId -> AES-256 key

  /**
   * Generate a new RSA key pair for this user
   */
  async generateKeyPair(): Promise<E2EEKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    this.keyPair = {
      publicKey: btoa(JSON.stringify(publicKeyJwk)),
      privateKey: btoa(JSON.stringify(privateKeyJwk)),
    };

    this.saveKeys();
    return this.keyPair;
  }

  /**
   * Load or generate key pair
   */
  async ensureKeyPair(): Promise<E2EEKeyPair> {
    if (this.keyPair) return this.keyPair;

    const saved = this.loadKeys();
    if (saved) {
      this.keyPair = saved;
      return saved;
    }

    return this.generateKeyPair();
  }

  /**
   * Save key pair to localStorage
   */
  private saveKeys(): void {
    if (this.keyPair) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.keyPair));
      } catch (e) {
        console.error('Failed to save E2EE keys:', e);
      }
    }
  }

  /**
   * Load key pair from localStorage
   */
  private loadKeys(): E2EEKeyPair | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load E2EE keys:', e);
    }
    return null;
  }

  /**
   * Store a recipient's public key
   */
  setRecipientPublicKey(userId: string, publicKeyBase64: string): void {
    this.recipientPublicKeys.set(userId, publicKeyBase64);
  }

  /**
   * Generate a random ephemeral AES key
   */
  private async generateEphemeralKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a message for a specific recipient
   */
  async encryptMessage(message: string, recipientUserId: string): Promise<EncryptedMessagePacket> {
    const recipientPublicKeyBase64 = this.recipientPublicKeys.get(recipientUserId);
    if (!recipientPublicKeyBase64) {
      throw new Error(`Public key not available for recipient ${recipientUserId}`);
    }

    try {
      console.log('[SimpleE2EE] Starting encryption for recipient:', recipientUserId);
      
      // 1. Generate ephemeral AES key
      const ephemeralKey = await this.generateEphemeralKey();
      console.log('[SimpleE2EE] Generated ephemeral AES key');

      // 2. Encrypt the message with ephemeral key
      const messageIv = crypto.getRandomValues(new Uint8Array(12));
      const messageBuffer = new TextEncoder().encode(message);
      const encryptedMessageBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: messageIv },
        ephemeralKey,
        messageBuffer
      );
      console.log('[SimpleE2EE] Encrypted message with ephemeral key, encrypted size:', encryptedMessageBuffer.byteLength);

      // 3. Export ephemeral key to raw bytes
      const ephemeralKeyRaw = await crypto.subtle.exportKey('raw', ephemeralKey);
      console.log('[SimpleE2EE] Exported ephemeral key to raw (256-bit AES)', ephemeralKeyRaw.byteLength, 'bytes');

      // 4. Encrypt ephemeral key with recipient's RSA public key
      let recipientPublicKeyJwk;
      try {
        recipientPublicKeyJwk = JSON.parse(atob(recipientPublicKeyBase64));
        console.log('[SimpleE2EE] Parsed recipient public key JWK');
      } catch (e) {
        throw new Error('Failed to parse recipient public key: ' + String(e));
      }

      const recipientPublicKey = await crypto.subtle.importKey(
        'jwk',
        recipientPublicKeyJwk,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );
      console.log('[SimpleE2EE] Imported recipient RSA public key for encryption');

      const encryptedEphemeralKeyBuffer = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        recipientPublicKey,
        ephemeralKeyRaw
      );
      console.log('[SimpleE2EE] Encrypted ephemeral key with RSA-OAEP, encrypted size:', encryptedEphemeralKeyBuffer.byteLength);

      // 5. Return the encrypted packet
      const packet = {
        encryptedMessage: this.arrayBufferToBase64(encryptedMessageBuffer),
        encryptedEphemeralKey: this.arrayBufferToBase64(encryptedEphemeralKeyBuffer),
        ephemeralKeyIv: this.arrayBufferToBase64(messageIv),  // Pass Uint8Array directly
        messageIv: this.arrayBufferToBase64(messageIv),  // Pass Uint8Array directly
      };
      
      console.log('[SimpleE2EE] Encryption complete, packet ready for transmission');
      return packet;
    } catch (e) {
      console.error('[SimpleE2EE] Encryption error:', { message: message.substring(0, 50), recipientUserId, error: e });
      throw e;
    }
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(packet: EncryptedMessagePacket): Promise<string> {
    console.log('[SimpleE2EE] decryptMessage called - keyPair available:', !!this.keyPair, 'keyPair:', this.keyPair ? { publicKeyLen: this.keyPair.publicKey.length, privateKeyLen: this.keyPair.privateKey.length } : null);
    
    if (!this.keyPair) {
      // Try to load from localStorage as fallback
      console.log('[SimpleE2EE] KeyPair not in memory, attempting to load from localStorage');
      const saved = this.loadKeys();
      if (saved) {
        this.keyPair = saved;
        console.log('[SimpleE2EE] KeyPair loaded from localStorage');
      } else {
        throw new Error('No key pair available - user not set up for E2EE');
      }
    }

    try {
      console.log('[SimpleE2EE] Starting decryption, packet check - has encryptedMessage:', !!(packet.encryptedMessage), 'has encryptedEphemeralKey:', !!(packet.encryptedEphemeralKey), 'has messageIv:', !!(packet.messageIv));
      
      if (!packet.encryptedMessage || !packet.encryptedEphemeralKey || !packet.messageIv) {
        throw new Error(`Invalid packet structure - missing fields: encryptedMessage=${!!packet.encryptedMessage}, encryptedEphemeralKey=${!!packet.encryptedEphemeralKey}, messageIv=${!!packet.messageIv}`);
      }
      
      // 1. Import private key
      let privateKeyJwk;
      try {
        privateKeyJwk = JSON.parse(atob(this.keyPair.privateKey));
        console.log('[SimpleE2EE] Parsed private key JWK');
      } catch (e) {
        throw new Error('Failed to parse private key JWK: ' + String(e));
      }

      const privateKey = await crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['decrypt']
      );
      console.log('[SimpleE2EE] Imported private RSA key for decryption');

      // 2. Decrypt ephemeral key with private key
      let encryptedEphemeralKeyBuffer;
      try {
        encryptedEphemeralKeyBuffer = this.base64ToArrayBuffer(packet.encryptedEphemeralKey);
        console.log('[SimpleE2EE] Decoded encryptedEphemeralKey from base64:', encryptedEphemeralKeyBuffer.byteLength, 'bytes');
      } catch (e) {
        throw new Error('Failed to decode encryptedEphemeralKey: ' + String(e));
      }

      let ephemeralKeyRaw;
      try {
        ephemeralKeyRaw = await crypto.subtle.decrypt(
          { name: 'RSA-OAEP' },
          privateKey,
          encryptedEphemeralKeyBuffer
        );
        console.log('[SimpleE2EE] RSA decrypted ephemeral key:', ephemeralKeyRaw.byteLength, 'bytes');
      } catch (e) {
        throw new Error('Failed to decrypt ephemeral key with RSA: ' + String(e));
      }

      // 3. Import ephemeral key
      let ephemeralKey;
      try {
        ephemeralKey = await crypto.subtle.importKey(
          'raw',
          ephemeralKeyRaw,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        console.log('[SimpleE2EE] Imported AES ephemeral key for decryption (256-bit)');
      } catch (e) {
        throw new Error('Failed to import ephemeral key: ' + String(e));
      }

      // 4. Decrypt message with ephemeral key
      let messageIv;
      let encryptedMessageBuffer;
      try {
        messageIv = new Uint8Array(this.base64ToArrayBuffer(packet.messageIv));
        encryptedMessageBuffer = this.base64ToArrayBuffer(packet.encryptedMessage);
        console.log('[SimpleE2EE] Decoded message IV:', messageIv.byteLength, 'bytes, encrypted message:', encryptedMessageBuffer.byteLength, 'bytes');
      } catch (e) {
        throw new Error('Failed to decode message or IV: ' + String(e));
      }

      let decryptedMessageBuffer;
      try {
        decryptedMessageBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: messageIv },
          ephemeralKey,
          encryptedMessageBuffer
        );
        console.log('[SimpleE2EE] AES-GCM decrypted message successfully:', decryptedMessageBuffer.byteLength, 'bytes');
      } catch (e) {
        throw new Error('Failed to decrypt message with AES-GCM: ' + String(e));
      }

      try {
        const result = new TextDecoder().decode(decryptedMessageBuffer);
        console.log('[SimpleE2EE] Message decrypted successfully, length:', result.length, 'chars');
        return result;
      } catch (e) {
        throw new Error('Failed to decode message text: ' + String(e));
      }
    } catch (e) {
      console.error('[SimpleE2EE] Decryption error:', e);
      throw e;
    }
  }

  /**
   * Generate a new AES-256-GCM key for chat encryption
   */
  async generateChatKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Get or create a chat key for a specific chat (SYNC version for immediate access)
   */
  async ensureChatKey(chatId: string): Promise<CryptoKey> {
    // Check if we have it in memory
    if (this.chatKeys.has(chatId)) {
      return this.chatKeys.get(chatId)!;
    }

    // Try to load from localStorage asynchronously
    const saved = await this.loadChatKeyAsync(chatId);
    if (saved) {
      this.chatKeys.set(chatId, saved);
      return saved;
    }

    // Generate new key
    const key = await this.generateChatKey();
    this.chatKeys.set(chatId, key);
    await this.saveChatKey(chatId, key);
    console.log('[SimpleE2EE] Generated new chat key for:', chatId);
    return key;
  }

  /**
   * Store a chat key in localStorage
   */
  private async saveChatKey(chatId: string, key: CryptoKey): Promise<void> {
    try {
      const exported = await crypto.subtle.exportKey('raw', key);
      const base64 = this.arrayBufferToBase64(exported);
      localStorage.setItem(`4messenger-chat-key-${chatId}`, base64);
      console.log('[SimpleE2EE] Saved chat key for:', chatId);
    } catch (e) {
      console.error('[SimpleE2EE] Failed to save chat key:', e);
    }
  }

  /**
   * Load a chat key from localStorage
   */
  private loadChatKey(chatId: string): CryptoKey | null {
    try {
      const base64 = localStorage.getItem(`4messenger-chat-key-${chatId}`);
      if (!base64) return null;

      // We can't directly import a key that's not in JWK format in an async context
      // So we'll return a promise and handle it differently
      const raw = this.base64ToArrayBuffer(base64);
      // Note: We need to import this async, so we'll handle that in a different method
      return null; // Placeholder - will be handled properly
    } catch (e) {
      console.error('[SimpleE2EE] Failed to load chat key:', e);
      return null;
    }
  }

  /**
   * Load a chat key from localStorage (async version)
   */
  async loadChatKeyAsync(chatId: string): Promise<CryptoKey | null> {
    try {
      const base64 = localStorage.getItem(`4messenger-chat-key-${chatId}`);
      if (!base64) return null;

      const raw = this.base64ToArrayBuffer(base64);
      const key = await crypto.subtle.importKey(
        'raw',
        raw,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );
      return key;
    } catch (e) {
      console.error('[SimpleE2EE] Failed to load chat key async:', e);
      return null;
    }
  }

  /**
   * Encrypt a message with a chat key
   */
  async encryptMessageWithChatKey(message: string, chatKey: CryptoKey): Promise<{ iv: string; ciphertext: string }> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const messageBuffer = new TextEncoder().encode(message);
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        chatKey,
        messageBuffer
      );

      return {
        iv: this.arrayBufferToBase64(iv),  // Pass the Uint8Array directly, not iv.buffer!
        ciphertext: this.arrayBufferToBase64(ciphertext),
      };
    } catch (e) {
      console.error('[SimpleE2EE] Failed to encrypt with chat key:', e);
      throw e;
    }
  }

  /**
   * Decrypt a message with a chat key
   */
  async decryptMessageWithChatKey(
    ciphertext: string,
    iv: string,
    chatKey: CryptoKey
  ): Promise<string> {
    try {
      console.log('[SimpleE2EE] Decrypting message with chat key, key type:', chatKey.type, 'IV base64 length:', iv.length, 'ciphertext base64 length:', ciphertext.length);
      
      const ciphertextBuffer = this.base64ToArrayBuffer(ciphertext);
      const ivBuffer = this.base64ToArrayBuffer(iv);
      const ivArray = new Uint8Array(ivBuffer); // Convert to Uint8Array for crypto.subtle
      
      console.log('[SimpleE2EE] Decoded buffers - IV byte length:', ivArray.byteLength, 'ciphertext byte length:', ciphertextBuffer.byteLength);

      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivArray }, // Use Uint8Array instead of ArrayBuffer
        chatKey,
        ciphertextBuffer
      );

      const result = new TextDecoder().decode(plaintext);
      console.log('[SimpleE2EE] ✓ Message decrypted successfully, plaintext length:', result.length);
      return result;
    } catch (e) {
      console.error('[SimpleE2EE] Failed to decrypt with chat key:', e, 'IV base64 length:', iv.length, 'IV base64:', iv.substring(0, 20));
      throw e;
    }
  }

  /**
   * Encrypt a chat key with a user's public key
   */
  async encryptChatKeyForUser(chatKey: CryptoKey, userPublicKeyBase64: string): Promise<string> {
    try {
      // Export the chat key to raw bytes
      const chatKeyRaw = await crypto.subtle.exportKey('raw', chatKey);

      // Import the user's public key
      let publicKeyJwk;
      try {
        publicKeyJwk = JSON.parse(atob(userPublicKeyBase64));
      } catch (e) {
        throw new Error('Failed to parse user public key: ' + String(e));
      }

      const publicKey = await crypto.subtle.importKey(
        'jwk',
        publicKeyJwk,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );

      // Encrypt the chat key with the user's public key
      const encryptedKey = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        chatKeyRaw
      );

      return this.arrayBufferToBase64(encryptedKey);
    } catch (e) {
      console.error('[SimpleE2EE] Failed to encrypt chat key for user:', e);
      throw e;
    }
  }

  /**
   * Decrypt a chat key with our private key
   */
  async decryptChatKey(encryptedKeyBase64: string): Promise<CryptoKey> {
    try {
      if (!this.keyPair) {
        throw new Error('No key pair available');
      }

      // Import our private key
      let privateKeyJwk;
      try {
        privateKeyJwk = JSON.parse(atob(this.keyPair.privateKey));
      } catch (e) {
        throw new Error('Failed to parse private key: ' + String(e));
      }

      console.log('[SimpleE2EE] Decrypting chat key with private key, encrypted length:', encryptedKeyBase64.length);

      const privateKey = await crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['decrypt']
      );

      // Decrypt the chat key
      const encryptedKeyBuffer = this.base64ToArrayBuffer(encryptedKeyBase64);
      console.log('[SimpleE2EE] Encrypted key buffer size:', encryptedKeyBuffer.byteLength, 'bytes');
      
      const chatKeyRaw = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedKeyBuffer
      );

      console.log('[SimpleE2EE] Chat key decrypted successfully, size:', chatKeyRaw.byteLength, 'bytes');

      // Import the decrypted key as an AES key
      const chatKey = await crypto.subtle.importKey(
        'raw',
        chatKeyRaw,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );

      return chatKey;
    } catch (e) {
      console.error('[SimpleE2EE] Failed to decrypt chat key:', e);
      console.error('[SimpleE2EE] Private key available:', !!this.keyPair?.privateKey);
      if (this.keyPair?.privateKey) {
        console.error('[SimpleE2EE] Private key length:', this.keyPair.privateKey.length);
      }
      throw e;
    }
  }

  /**
   * Get public key to send to server
   */
  async getPublicKey(): Promise<string> {
    const keyPair = await this.ensureKeyPair();
    return keyPair.publicKey;
  }

  /**
   * Clear all keys
   */
  clearKeys(): void {
    this.keyPair = null;
    this.recipientPublicKeys.clear();
    this.chatKeys.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Clear all chat keys from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('4messenger-chat-key-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Failed to clear E2EE keys:', e);
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  /**
   * Convert ArrayBuffer or Uint8Array to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    let bytes: Uint8Array;
    
    // Handle both ArrayBuffer and Uint8Array inputs
    if (buffer instanceof Uint8Array) {
      bytes = buffer;
    } else {
      bytes = new Uint8Array(buffer);
    }
    
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer (exact size, no padding)
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    // Create an ArrayBuffer of EXACTLY the right size
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return buffer; // This is exactly binary.length bytes
  }
}

// Export singleton instance
export const e2ee = new SimpleE2EE();
