import crypto from 'crypto';

/**
 * Generates a cryptographically secure 6-digit OTP string.
 */
export function generateSecureOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Hashes a plaintext OTP using SHA-256 for secure database storage.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
}

/**
 * Compares an incoming OTP against the stored hash in constant time to prevent timing attacks.
 */
export function verifyOtpHash(inputOtp: string, storedHash: string): boolean {
  const inputHash = hashOtp(inputOtp);
  if (inputHash.length !== storedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
}

/**
 * Generates unique sequence identifiers
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `NIT-${year}-${randomSuffix}`;
}

export function generateLaundryOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `LAU-${year}-${randomSuffix}`;
}

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RCP-${year}-${randomSuffix}`;
}

export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TKT-${year}-${randomSuffix}`;
}
