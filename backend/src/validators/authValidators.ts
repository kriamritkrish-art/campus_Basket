import { z } from 'zod';

export const NIT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@nitdgp\.ac\.in$/i;

/**
 * Validates strictly that the provided email belongs to the NIT Durgapur domain (@nitdgp.ac.in).
 */
export function isValidNitEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (clean === 'souravsenapati055@gmail.com' || clean === 'souravsenapati408@gmail.com') return true;
  return NIT_EMAIL_REGEX.test(clean);
}

/**
 * Stage 1: Send OTP to official College Email (@nitdgp.ac.in)
 */
export const sendCollegeOtpSchema = z.object({
  collegeEmail: z
    .string()
    .email('Please enter a valid email address')
    .refine((val) => isValidNitEmail(val), {
      message: 'Only official NIT Durgapur college email addresses (@nitdgp.ac.in) are permitted.'
    })
});

// Alias for backwards compatibility
export const sendOtpSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .refine((val) => isValidNitEmail(val), {
      message: 'Only official NIT Durgapur college email addresses (@nitdgp.ac.in) are permitted.'
    }),
  password: z.string().optional()
});

/**
 * Stage 2: Verify College Email OTP
 */
export const verifyCollegeOtpSchema = z.object({
  collegeEmail: z
    .string()
    .email('Please enter a valid email address')
    .refine((val) => isValidNitEmail(val), {
      message: 'Only official NIT Durgapur college email addresses (@nitdgp.ac.in) are permitted.'
    }),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers')
});

// Alias for backwards compatibility
export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers')
});

/**
 * Stage 3: Send OTP to Personal Email
 */
export const sendPersonalOtpSchema = z.object({
  collegeEmail: z.string().email().optional(),
  personalEmail: z
    .string()
    .email('Please enter a valid personal email address')
    .refine((val) => !val.trim().toLowerCase().endsWith('@nitdgp.ac.in'), {
      message: 'Personal email cannot be your official @nitdgp.ac.in college email.'
    })
});

/**
 * Stage 4: Verify Personal Email OTP
 */
export const verifyPersonalOtpSchema = z.object({
  personalEmail: z.string().email('Please enter a valid personal email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers')
});

/**
 * Stage 5-7: Complete Registration
 */
export const completeRegistrationSchema = z.object({
  collegeEmail: z
    .string()
    .email()
    .refine((val) => isValidNitEmail(val), {
      message: 'Only official NIT Durgapur college email addresses (@nitdgp.ac.in) are permitted.'
    }),
  personalEmail: z.string().email('Please enter a valid personal email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  rollNumber: z.string().min(4, 'Invalid roll number format').max(30),
  registrationNumber: z.string().min(4, 'Invalid registration number format').max(30),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'),
  department: z.string().optional().default('Computer Science & Engineering'),
  programme: z.string().optional().default('B.Tech'),
  year: z.string().optional().default('1st Year'),
  hallId: z.string().min(1, 'Please select your residence hall'),
  hallNumber: z.string().optional(),
  roomNumber: z.string().min(1, 'Please enter your room number').max(20),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  email: z.string().optional()
});

/**
 * Login Schema: Accepts either College Email OR Personal Email
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Google Sign-In Schema
 */
export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required')
});

/**
 * Password Recovery: Can provide either College Email OR Personal Email
 */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address')
});

/**
 * Password Reset: Email + 6-digit OTP + New Password
 */
export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});
