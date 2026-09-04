import { describe, it, expect } from 'vitest';
import { isValidNitEmail, sendOtpSchema } from '../backend/src/validators/authValidators';
import { generateSecureOtp, hashOtp, verifyOtpHash } from '../backend/src/utils/crypto';

describe('NIT Durgapur Student Email & OTP Security', () => {
  it('strictly allows valid NIT Durgapur college emails (@nitdgp.ac.in)', () => {
    expect(isValidNitEmail('ss.24u10227@nitdgp.ac.in')).toBe(true);
    expect(isValidNitEmail('student.cs@nitdgp.ac.in')).toBe(true);
    expect(isValidNitEmail('2024ug1234@nitdgp.ac.in')).toBe(true);
  });

  it('strictly rejects non-NIT emails (gmail, yahoo, outlook, others)', () => {
    expect(isValidNitEmail('student@gmail.com')).toBe(false);
    expect(isValidNitEmail('student@yahoo.co.in')).toBe(false);
    expect(isValidNitEmail('student@outlook.com')).toBe(false);
    expect(isValidNitEmail('student@nitdgp.com')).toBe(false);
    expect(isValidNitEmail('student@nitdgp.org')).toBe(false);
    expect(isValidNitEmail('student@nitdgp.ac.in.fake.com')).toBe(false);
  });

  it('rejects invalid email formats in Zod validation', () => {
    const invalidGmail = sendOtpSchema.safeParse({
      email: 'hacker@gmail.com',
      password: 'Password123'
    });
    expect(invalidGmail.success).toBe(false);

    const validNit = sendOtpSchema.safeParse({
      email: 'ss.24u10227@nitdgp.ac.in',
      password: 'Password123'
    });
    expect(validNit.success).toBe(true);
  });

  it('generates a 6-digit numeric OTP and hashes with SHA-256', () => {
    const otp = generateSecureOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);

    const hash1 = hashOtp(otp);
    const hash2 = hashOtp(otp);
    expect(hash1).toEqual(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string

    // Timing-safe verification
    expect(verifyOtpHash(otp, hash1)).toBe(true);
    expect(verifyOtpHash('000000', hash1)).toBe(false);
  });
});
