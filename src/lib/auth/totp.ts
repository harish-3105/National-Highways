import crypto from 'crypto';

// Base32 RFC 4648 Alphabet (Standard for Google Authenticator)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer or Uint8Array into a Base32 string (without padding)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer
 */
export function base32Decode(base32: string): Buffer {
  const sanitized = base32.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) {
      continue; // Skip invalid characters
    }

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure Base32 secret key (160-bit / 20 bytes)
 */
export function generateTotpSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generates a 6-digit TOTP code for a given secret and counter
 */
export function generateTotpCode(secret: string, timeStepWindow: number = 0): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30) + timeStepWindow;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1] & 0x0f;
  const codeInt =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (codeInt % 1_000_000).toString().padStart(6, '0');
  return otp;
}

/**
 * Verifies a 6-digit TOTP code against a secret with time-drift protection (±1 window = 30s before/after)
 */
export function verifyTotpCode(token: string, secret: string, window: number = 1): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim().replace(/\s/g, '');
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false;
  }

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const validCode = generateTotpCode(secret, errorWindow);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(validCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Builds the standard otpauth:// URI for Google Authenticator / Microsoft Authenticator
 */
export function getTotpAuthUri(label: string, secret: string, issuer: string = 'TNHighways'): string {
  const encodedLabel = encodeURIComponent(label);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
