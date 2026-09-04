import { z } from 'zod';

export const NIT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@nitdgp\.ac\.in$/i;

/**
 * Validates strictly that the provided email belongs to the NIT Durgapur domain (@nitdgp.ac.in).
 */
export function isValidNitEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return NIT_EMAIL_REGEX.test(email.trim().toLowerCase());
}

export const sendOtpSchema = z.object({
  email: z
    .string()
    .email('Invalid email address format')
    .refine((val) => isValidNitEmail(val), {
      message: 'Only official NIT Durgapur college email addresses (@nitdgp.ac.in) are permitted.'
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email()
    .refine((val) => isValidNitEmail(val), {
      message: 'Only official NIT Durgapur college email addresses (@nitdgp.ac.in) are permitted.'
    }),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers')
});

export const completeRegistrationSchema = z.object({
  email: z
    .string()
    .email()
    .refine((val) => isValidNitEmail(val), {
      message: 'Only official NIT Durgapur college email addresses (@nitdgp.ac.in) are permitted.'
    }),
  password: z.string().min(8),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  rollNumber: z.string().min(4, 'Invalid roll number format').max(30),
  registrationNumber: z.string().min(4, 'Invalid registration number format').max(30),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'),
  hallId: z.string().min(1, 'Please select your residence hall'),
  hallNumber: z.string().optional(),
  roomNumber: z.string().min(1, 'Please enter your room number').max(20)
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().refine((val) => isValidNitEmail(val), {
    message: 'Must be an official NIT Durgapur email address'
  })
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long')
});
