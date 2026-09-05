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

/**
 * Masks an email address for privacy (e.g. ss.24u10227@nitdgp.ac.in -> ss.****@nitdgp.ac.in, student@gmail.com -> stu****@gmail.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 3) {
    return `${local[0]}****@${domain}`;
  }
  const prefix = local.slice(0, 3);
  return `${prefix}****@${domain}`;
}
