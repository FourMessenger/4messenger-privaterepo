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
        ephemeralKeyIv: this.arrayBufferToBase64(messageIv.buffer as ArrayBuffer),
        messageIv: this.arrayBufferToBase64(messageIv.buffer as ArrayBuffer),
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
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear E2EE keys:', e);
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Export singleton instance
export const e2ee = new SimpleE2EE();
