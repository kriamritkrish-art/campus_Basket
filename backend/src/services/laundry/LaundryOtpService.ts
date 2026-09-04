import { generateSecureOtp, hashOtp, verifyOtpHash } from '../../utils/crypto';

export interface LaundryOtpRecord {
  id: string;
  laundryOrderId: string;
  otpType: 'PICKUP' | 'DELIVERY';
  otpHash: string;
  isUsed: boolean;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
}

export class LaundryOtpService {
  /**
   * Generates a distinct 6-digit OTP for either Pickup or Delivery.
   * Returns plaintext OTP to be shown to the student / emailed,
   * and the SHA-256 hash to be stored in the database.
   */
  public generateOtp(
    laundryOrderId: string,
    otpType: 'PICKUP' | 'DELIVERY',
    expirationMinutes: number = 60 * 24 // Valid for the scheduled day (or 24h)
  ): { plainOtp: string; otpHash: string; expiresAt: Date } {
    const plainOtp = generateSecureOtp();
    const otpHash = hashOtp(plainOtp);
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    return {
      plainOtp,
      otpHash,
      expiresAt
    };
  }

  /**
   * Verifies an OTP against a stored LaundryOtp record.
   * Strict security checks:
   * 1. Confirms record is not already used.
   * 2. Confirms target otpType matches strictly (e.g. PICKUP cannot verify DELIVERY).
   * 3. Confirms OTP has not expired.
   * 4. Throttles attempts (max 3 allowed).
   * 5. Performs constant-time hash comparison.
   */
  public verifyOtp(
    inputOtp: string,
    record: LaundryOtpRecord,
    expectedType: 'PICKUP' | 'DELIVERY'
  ): VerificationResult {
    // Check 1: Enforce matching OTP type
    if (record.otpType !== expectedType) {
      return {
        success: false,
        message: `Invalid OTP type. A ${record.otpType} OTP cannot be used to verify ${expectedType}.`
      };
    }

    // Check 2: Single-use enforcement
    if (record.isUsed) {
      return {
        success: false,
        message: `This ${expectedType} OTP has already been used and is no longer valid.`
      };
    }

    // Check 3: Expiration
    if (new Date() > new Date(record.expiresAt)) {
      return {
        success: false,
        message: `This ${expectedType} OTP has expired. Please request a new code.`
      };
    }

    // Check 4: Maximum attempts (max 3)
    if (record.attempts >= 3) {
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. OTP is locked for security reasons.'
      };
    }

    // Check 5: Timing-safe cryptographic comparison
    const isMatch = verifyOtpHash(inputOtp, record.otpHash);
    if (!isMatch) {
      const remaining = 2 - record.attempts;
      return {
        success: false,
        message: remaining > 0 
          ? `Incorrect OTP. ${remaining} attempt(s) remaining.` 
          : 'Incorrect OTP. Verification limit reached.',
        attemptsRemaining: remaining
      };
    }

    return {
      success: true,
      message: `${expectedType} verified successfully.`
    };
  }
}
