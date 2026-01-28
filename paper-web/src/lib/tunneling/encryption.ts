/**
 * End-to-End Encryption Layer
 * Uses libsodium for secure encryption of tunnel data
 */

// import sodium from 'libsodium-wrappers';
const sodium: any = null; // Placeholder - will be loaded dynamically

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface EncryptedMessage {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
}

export class EncryptionLayer {
  private initialized = false;
  private keyPair: KeyPair | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize libsodium
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    await sodium.ready;
    this.initialized = true;
    console.log('Encryption layer initialized');
  }

  /**
   * Generate keypair for encryption
   */
  async generateKeyPair(): Promise<KeyPair> {
    await this.ensureInitialized();

    const keyPair = sodium.crypto_box_keypair();
    this.keyPair = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    };

    return this.keyPair;
  }

  /**
   * Get current keypair
   */
  getKeyPair(): KeyPair | null {
    return this.keyPair;
  }

  /**
   * Set keypair
   */
  setKeyPair(keyPair: KeyPair): void {
    this.keyPair = keyPair;
  }

  /**
   * Encrypt message for recipient
   */
  async encrypt(
    message: Uint8Array | string,
    recipientPublicKey: Uint8Array
  ): Promise<EncryptedMessage> {
    await this.ensureInitialized();

    if (!this.keyPair) {
      throw new Error('Keypair not generated');
    }

    const messageBytes = typeof message === 'string'
      ? sodium.from_string(message)
      : message;

    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);

    const ciphertext = sodium.crypto_box_easy(
      messageBytes,
      nonce,
      recipientPublicKey,
      this.keyPair.privateKey
    );

    return { ciphertext, nonce };
  }

  /**
   * Decrypt message from sender
   */
  async decrypt(
    encrypted: EncryptedMessage,
    senderPublicKey: Uint8Array
  ): Promise<Uint8Array> {
    await this.ensureInitialized();

    if (!this.keyPair) {
      throw new Error('Keypair not generated');
    }

    const decrypted = sodium.crypto_box_open_easy(
      encrypted.ciphertext,
      encrypted.nonce,
      senderPublicKey,
      this.keyPair.privateKey
    );

    return decrypted;
  }

  /**
   * Symmetric encryption (for onion layers)
   */
  async symmetricEncrypt(
    message: Uint8Array | string,
    key: Uint8Array
  ): Promise<EncryptedMessage> {
    await this.ensureInitialized();

    const messageBytes = typeof message === 'string'
      ? sodium.from_string(message)
      : message;

    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

    const ciphertext = sodium.crypto_secretbox_easy(messageBytes, nonce, key);

    return { ciphertext, nonce };
  }

  /**
   * Symmetric decryption (for onion layers)
   */
  async symmetricDecrypt(
    encrypted: EncryptedMessage,
    key: Uint8Array
  ): Promise<Uint8Array> {
    await this.ensureInitialized();

    const decrypted = sodium.crypto_secretbox_open_easy(
      encrypted.ciphertext,
      encrypted.nonce,
      key
    );

    return decrypted;
  }

  /**
   * Generate symmetric key
   */
  async generateSymmetricKey(): Promise<Uint8Array> {
    await this.ensureInitialized();
    return sodium.crypto_secretbox_keygen();
  }

  /**
   * Derive shared secret from public/private keys (ECDH)
   */
  async deriveSharedSecret(
    theirPublicKey: Uint8Array
  ): Promise<Uint8Array> {
    await this.ensureInitialized();

    if (!this.keyPair) {
      throw new Error('Keypair not generated');
    }

    return sodium.crypto_scalarmult(this.keyPair.privateKey, theirPublicKey);
  }

  /**
   * Hash data
   */
  async hash(data: Uint8Array | string): Promise<Uint8Array> {
    await this.ensureInitialized();

    const dataBytes = typeof data === 'string'
      ? sodium.from_string(data)
      : data;

    return sodium.crypto_generichash(32, dataBytes);
  }

  /**
   * Generate random bytes
   */
  async randomBytes(length: number): Promise<Uint8Array> {
    await this.ensureInitialized();
    return sodium.randombytes_buf(length);
  }

  /**
   * Convert Uint8Array to hex string
   */
  toHex(bytes: Uint8Array): string {
    return sodium.to_hex(bytes);
  }

  /**
   * Convert hex string to Uint8Array
   */
  fromHex(hex: string): Uint8Array {
    return sodium.from_hex(hex);
  }

  /**
   * Convert Uint8Array to base64
   */
  toBase64(bytes: Uint8Array): string {
    return sodium.to_base64(bytes);
  }

  /**
   * Convert base64 to Uint8Array
   */
  fromBase64(base64: string): Uint8Array {
    return sodium.from_base64(base64);
  }

  /**
   * Ensure libsodium is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Singleton instance
let encryptionLayerInstance: EncryptionLayer | null = null;

/**
 * Get the global encryption layer instance
 */
export function getEncryptionLayer(): EncryptionLayer {
  if (!encryptionLayerInstance) {
    encryptionLayerInstance = new EncryptionLayer();
  }
  return encryptionLayerInstance;
}
