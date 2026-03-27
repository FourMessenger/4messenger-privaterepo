/**
 * File Encryption Utilities
 * Uses AES-GCM for client-side file encryption
 */

/**
 * Encrypt file data using AES-GCM
 * Returns: { encrypted: ArrayBuffer, iv: Uint8Array, salt: Uint8Array }
 */
export async function encryptFileData(
  fileData: ArrayBuffer,
  password: string
): Promise<{
  encrypted: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
}> {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from password
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Encrypt file data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileData
  );

  return { encrypted, iv, salt };
}

/**
 * Decrypt file data using AES-GCM
 */
export async function decryptFileData(
  encryptedData: ArrayBuffer,
  password: string,
  iv: Uint8Array,
  salt: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );
}

/**
 * Convert ArrayBuffer to Base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
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
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * Encrypt file as FormData with metadata
 */
export async function encryptFileForUpload(
  file: File,
  password: string
): Promise<{
  formData: FormData;
  encryptionMetadata: {
    iv: string;
    salt: string;
    originalName: string;
    mimeType: string;
    originalSize: number;
  };
}> {
  // Read file
  const fileBuffer = await file.arrayBuffer();

  // Encrypt file data
  const { encrypted, iv, salt } = await encryptFileData(fileBuffer, password);

  // Create encrypted blob and add to form data
  const encryptedBlob = new Blob([encrypted], { type: 'application/octet-stream' });
  const formData = new FormData();
  formData.append('file', encryptedBlob, file.name);

  // Include metadata in form data
  const encryptionMetadata = {
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    originalName: file.name,
    mimeType: file.type,
    originalSize: file.size,
  };

  formData.append('encryptionMetadata', JSON.stringify(encryptionMetadata));

  return { formData, encryptionMetadata };
}

/**
 * Decrypt file blob and return as File object
 */
export async function decryptFileBlob(
  encryptedBlob: Blob,
  password: string,
  iv: string,
  salt: string,
  originalName: string
): Promise<File> {
  const encryptedBuffer = await encryptedBlob.arrayBuffer();
  const ivBytes = new Uint8Array(base64ToArrayBuffer(iv));
  const saltBytes = new Uint8Array(base64ToArrayBuffer(salt));

  const decrypted = await decryptFileData(encryptedBuffer, password, ivBytes, saltBytes);
  return new File([decrypted], originalName, { type: 'application/octet-stream' });
}
