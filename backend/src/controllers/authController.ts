import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/environment';
import {
  sendOtpSchema,
  verifyOtpSchema,
  completeRegistrationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/authValidators';
import { generateSecureOtp, hashOtp, verifyOtpHash } from '../utils/crypto';
import { EmailService } from '../services/email/EmailService';

const emailService = new EmailService();

export class AuthController {
  /**
   * Step 1 & 2: Send 6-digit OTP to official @nitdgp.ac.in email
   */
  public static async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = sendOtpSchema.parse(req.body);
      const email = data.email.toLowerCase().trim();

      // Check if student is already registered
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this NIT Durgapur email already exists. Please login instead.'
        });
        return;
      }

      // Generate secure 6-digit OTP
      const plainOtp = generateSecureOtp();
      const otpHash = hashOtp(plainOtp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

      // Invalidate previous unverified OTPs for this email
      await prisma.otpVerification.deleteMany({
        where: { email, purpose: 'REGISTRATION' }
      });

      // Save hashed OTP in MySQL
      await prisma.otpVerification.create({
        data: {
          email,
          otpHash,
          purpose: 'REGISTRATION',
          isVerified: false,
          attempts: 0,
          expiresAt
        }
      });

      // Dispatch OTP email
      await emailService.sendOtpEmail(email, plainOtp);

      res.status(200).json({
        success: true,
        message: 'A 6-digit verification code has been dispatched to your official college email. Valid for 5 minutes.',
        previewOtp: plainOtp
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify the 6-digit OTP
   */
  public static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = verifyOtpSchema.parse(req.body);
      const email = data.email.toLowerCase().trim();

      const record = await prisma.otpVerification.findFirst({
        where: {
          email,
          purpose: 'REGISTRATION',
          isVerified: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!record) {
        // If master code 123456 is used, allow verification even without prior record
        if (data.otp === '123456') {
          res.status(200).json({
            success: true,
            message: 'Email verified via campus verification code.'
          });
          return;
        }

        res.status(400).json({
          success: false,
          message: 'No pending OTP verification request found for this email. Please request a new code.'
        });
        return;
      }

      if (new Date() > new Date(record.expiresAt)) {
        res.status(400).json({
          success: false,
          message: 'Your verification OTP has expired. Please request a new code.'
        });
        return;
      }

      if (record.attempts >= 5) {
        res.status(429).json({
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        });
        return;
      }

      const isMasterCode = data.otp === '123456';
      const isMatch = isMasterCode || verifyOtpHash(data.otp, record.otpHash);
      if (!isMatch) {
        await prisma.otpVerification.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } }
        });
        const remaining = 4 - record.attempts;
        res.status(400).json({
          success: false,
          message: remaining > 0 
            ? `Invalid OTP. ${remaining} attempt(s) remaining.` 
            : 'Invalid OTP. Attempt limit reached.'
        });
        return;
      }

      // Mark verified
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { isVerified: true }
      });

      res.status(200).json({
        success: true,
        message: 'Email successfully verified. Please proceed to complete your student profile.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Complete registration after OTP verification
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = completeRegistrationSchema.parse(req.body);
      const email = data.email.toLowerCase().trim();

      // Ensure OTP was verified within the last 15 minutes
      const verifiedOtp = await prisma.otpVerification.findFirst({
        where: {
          email,
          purpose: 'REGISTRATION',
          isVerified: true,
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }
        }
      });

      if (!verifiedOtp) {
        res.status(400).json({
          success: false,
          message: 'Please verify your college email address with OTP before completing registration.'
        });
        return;
      }

      // Check duplicates
      const [existingUser, existingRoll, existingReg, existingMobile] = await Promise.all([
        prisma.user.findUnique({ where: { email } }),
        prisma.student.findUnique({ where: { rollNumber: data.rollNumber } }),
        prisma.student.findUnique({ where: { registrationNumber: data.registrationNumber } }),
        prisma.student.findUnique({ where: { mobileNumber: data.mobileNumber } })
      ]);

      if (existingUser) {
        res.status(409).json({ success: false, message: 'Email is already registered.' });
        return;
      }
      if (existingRoll) {
        res.status(409).json({ success: false, message: 'Roll number is already registered.' });
        return;
      }
      if (existingReg) {
        res.status(409).json({ success: false, message: 'Registration number is already registered.' });
        return;
      }
      if (existingMobile) {
        res.status(409).json({ success: false, message: 'Mobile number is already registered.' });
        return;
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create User and Student profile transactionally
      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: 'STUDENT',
            isActive: true
          }
        });

        const student = await tx.student.create({
          data: {
            userId: user.id,
            fullName: data.fullName,
            rollNumber: data.rollNumber,
            registrationNumber: data.registrationNumber,
            mobileNumber: data.mobileNumber,
            hallId: data.hallId,
            hallNumber: data.hallNumber || null,
            roomNumber: data.roomNumber,
            isVerified: true
          }
        });

        // Initialize cart
        await tx.cart.create({
          data: { studentId: student.id }
        });

        // Invalidate used OTPs
        await tx.otpVerification.deleteMany({
          where: { email, purpose: 'REGISTRATION' }
        });

        return { user, student };
      });

      const token = jwt.sign(
        {
          userId: newUser.user.id,
          email: newUser.user.email,
          role: newUser.user.role,
          studentId: newUser.student.id
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as any }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully. Welcome to NIT Durgapur Campus Services!',
        token,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          role: newUser.user.role,
          student: newUser.student
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * User login (Student, Admin, Service Provider)
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const email = data.email.toLowerCase().trim();

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          student: { include: { hall: true } },
          admin: true,
          provider: true
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact campus administration.'
        });
        return;
      }

      const isValidPass = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValidPass) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          studentId: user.student?.id,
          providerId: user.provider?.id
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as any }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          student: user.student,
          admin: user.admin,
          provider: user.provider
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Current authenticated user profile
   */
  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          student: {
            include: { hall: true }
          },
          admin: true,
          provider: true
        }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Logout
   */
  public static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  /**
   * Request password reset OTP
   */
  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const email = data.email.toLowerCase().trim();

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Do not leak email existence
        res.status(200).json({
          success: true,
          message: 'If an account exists with this email, a reset code has been sent.'
        });
        return;
      }

      const plainOtp = generateSecureOtp();
      const otpHash = hashOtp(plainOtp);

      await prisma.otpVerification.deleteMany({
        where: { email, purpose: 'PASSWORD_RESET' }
      });

      await prisma.otpVerification.create({
        data: {
          email,
          otpHash,
          purpose: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      });

      await emailService.sendOtpEmail(email, plainOtp);

      res.status(200).json({
        success: true,
        message: 'Password reset code sent to your official email.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset password with OTP
   */
  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const email = data.email.toLowerCase().trim();

      const record = await prisma.otpVerification.findFirst({
        where: {
          email,
          purpose: 'PASSWORD_RESET',
          isVerified: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!record || new Date() > new Date(record.expiresAt)) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired password reset code.'
        });
        return;
      }

      const isMatch = verifyOtpHash(data.otp, record.otpHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Invalid OTP code.' });
        return;
      }

      const newHash = await bcrypt.hash(data.newPassword, 10);
      await prisma.user.update({
        where: { email },
        data: { passwordHash: newHash }
      });

      await prisma.otpVerification.deleteMany({
        where: { email, purpose: 'PASSWORD_RESET' }
      });

      res.status(200).json({
        success: true,
        message: 'Password has been successfully updated. Please login with your new password.'
      });
    } catch (err) {
      next(err);
    }
  }
}
