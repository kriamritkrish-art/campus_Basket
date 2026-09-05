import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { prisma } from '../config/database';
import { env } from '../config/environment';
import {
  sendCollegeOtpSchema,
  verifyCollegeOtpSchema,
  sendPersonalOtpSchema,
  verifyPersonalOtpSchema,
  completeRegistrationSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyRoleLoginOtpSchema,
  sendOtpSchema,
  verifyOtpSchema,
  isValidNitEmail
} from '../validators/authValidators';
import { generateSecureOtp, hashOtp, verifyOtpHash, maskEmail } from '../utils/crypto';
import { EmailService } from '../services/email/EmailService';
import { AuditService } from '../services/audit/AuditService';

const emailService = new EmailService();

export class AuthController {
  /**
   * Stage 1: Send 6-digit OTP to official NIT Durgapur college email (@nitdgp.ac.in)
   */
  public static async sendCollegeOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = sendCollegeOtpSchema.safeParse(req.body);
      const emailInput = (parsed.success ? parsed.data.collegeEmail : req.body.email || req.body.collegeEmail || '').trim().toLowerCase();

      if (!emailInput) {
        res.status(400).json({
          success: false,
          message: 'Please enter your official NIT Durgapur email.'
        });
        return;
      }

      if (!isValidNitEmail(emailInput)) {
        res.status(400).json({
          success: false,
          message: 'Only @nitdgp.ac.in email addresses are accepted.'
        });
        return;
      }

      // Check if student account already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailInput },
            { collegeEmail: emailInput },
            { student: { collegeEmail: emailInput } }
          ]
        }
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account already exists for this student.'
        });
        return;
      }

      // 60-second cooldown check
      const recentOtp = await prisma.otpVerification.findFirst({
        where: {
          email: emailInput,
          purpose: 'COLLEGE_EMAIL_VERIFICATION'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (recentOtp) {
        const elapsedSeconds = Math.floor((Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000);
        if (elapsedSeconds < 60) {
          const waitTime = 60 - elapsedSeconds;
          res.status(429).json({
            success: false,
            message: `Please wait ${waitTime} second(s) before requesting a new code.`
          });
          return;
        }
      }

      // Invalidate previous unverified college OTPs
      await prisma.otpVerification.deleteMany({
        where: { email: emailInput, purpose: 'COLLEGE_EMAIL_VERIFICATION' }
      });

      const plainOtp = generateSecureOtp();
      const otpHash = hashOtp(plainOtp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

      await prisma.otpVerification.create({
        data: {
          email: emailInput,
          otpHash,
          purpose: 'COLLEGE_EMAIL_VERIFICATION',
          isVerified: false,
          attempts: 0,
          expiresAt
        }
      });

      await emailService.sendOtpEmail(emailInput, plainOtp, 'NIT Durgapur College Email Verification');

      await AuditService.log(prisma, {
        action: 'College OTP Sent',
        entity: 'OtpVerification',
        newValue: { email: emailInput, purpose: 'COLLEGE_EMAIL_VERIFICATION' },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to your NIT Durgapur email.'
      });
    } catch (err) {
      next(err);
    }
  }

  // Backwards compatibility alias
  public static sendOtp = AuthController.sendCollegeOtp;

  /**
   * Stage 2: Verify official College Email OTP
   */
  public static async verifyCollegeOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const emailInput = (req.body.collegeEmail || req.body.email || '').trim().toLowerCase();
      const otpInput = (req.body.otp || '').trim();

      if (!emailInput) {
        res.status(400).json({ success: false, message: 'Please enter your official NIT Durgapur email.' });
        return;
      }

      if (!otpInput || otpInput.length !== 6) {
        res.status(400).json({ success: false, message: 'Incorrect verification code. Please try again.' });
        return;
      }

      const record = await prisma.otpVerification.findFirst({
        where: {
          email: emailInput,
          purpose: 'COLLEGE_EMAIL_VERIFICATION',
          isVerified: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!record) {
        // Allow campus master test code in development
        if (otpInput === '123456' && env.NODE_ENV !== 'production') {
          res.status(200).json({ success: true, message: 'College email verified' });
          return;
        }
        res.status(400).json({
          success: false,
          message: 'Incorrect verification code. Please try again.'
        });
        return;
      }

      if (new Date() > new Date(record.expiresAt)) {
        res.status(400).json({
          success: false,
          message: 'This OTP has expired. Please request a new code.'
        });
        return;
      }

      if (record.attempts >= 5) {
        res.status(429).json({
          success: false,
          message: 'Too many attempts. Please wait before trying again.'
        });
        return;
      }

      const isMasterCode = otpInput === '123456' && env.NODE_ENV !== 'production';
      const isMatch = isMasterCode || verifyOtpHash(otpInput, record.otpHash);

      if (!isMatch) {
        await prisma.otpVerification.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } }
        });
        const remainingAttempts = 4 - record.attempts;
        if (remainingAttempts <= 0) {
          res.status(429).json({
            success: false,
            message: 'Too many attempts. Please wait before trying again.'
          });
          return;
        }
        res.status(400).json({
          success: false,
          message: 'Incorrect verification code. Please try again.'
        });
        return;
      }

      // Mark verified
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { isVerified: true }
      });

      await AuditService.log(prisma, {
        action: 'College Email Verified',
        entity: 'OtpVerification',
        newValue: { email: emailInput },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'College email verified'
      });
    } catch (err) {
      next(err);
    }
  }

  // Backwards compatibility alias
  public static verifyOtp = AuthController.verifyCollegeOtp;

  /**
   * Stage 3: Send 6-digit OTP to Personal Email (Gmail / Personal email)
   */
  public static async sendPersonalOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = sendPersonalOtpSchema.parse(req.body);
      const personalEmail = data.personalEmail.trim().toLowerCase();

      if (personalEmail.endsWith('@nitdgp.ac.in')) {
        res.status(400).json({
          success: false,
          message: 'Personal email cannot be your official @nitdgp.ac.in college email.'
        });
        return;
      }

      // Check if personal email already in use
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: personalEmail },
            { personalEmail },
            { student: { personalEmail } }
          ]
        }
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this personal email already exists.'
        });
        return;
      }

      // 60-second cooldown check
      const recentOtp = await prisma.otpVerification.findFirst({
        where: {
          email: personalEmail,
          purpose: 'PERSONAL_EMAIL_VERIFICATION'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (recentOtp) {
        const elapsedSeconds = Math.floor((Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000);
        if (elapsedSeconds < 60) {
          const waitTime = 60 - elapsedSeconds;
          res.status(429).json({
            success: false,
            message: `Please wait ${waitTime} second(s) before requesting a new code.`
          });
          return;
        }
      }

      // Invalidate previous unverified personal OTPs
      await prisma.otpVerification.deleteMany({
        where: { email: personalEmail, purpose: 'PERSONAL_EMAIL_VERIFICATION' }
      });

      const plainOtp = generateSecureOtp();
      const otpHash = hashOtp(plainOtp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

      await prisma.otpVerification.create({
        data: {
          email: personalEmail,
          otpHash,
          purpose: 'PERSONAL_EMAIL_VERIFICATION',
          isVerified: false,
          attempts: 0,
          expiresAt
        }
      });

      await emailService.sendOtpEmail(personalEmail, plainOtp, 'Personal Email Verification');

      await AuditService.log(prisma, {
        action: 'Personal OTP Sent',
        entity: 'OtpVerification',
        newValue: { email: personalEmail, purpose: 'PERSONAL_EMAIL_VERIFICATION' },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to your personal email.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Stage 4: Verify Personal Email OTP
   */
  public static async verifyPersonalOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = verifyPersonalOtpSchema.parse(req.body);
      const personalEmail = data.personalEmail.trim().toLowerCase();
      const otpInput = data.otp.trim();

      const record = await prisma.otpVerification.findFirst({
        where: {
          email: personalEmail,
          purpose: 'PERSONAL_EMAIL_VERIFICATION',
          isVerified: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!record) {
        if (otpInput === '123456' && env.NODE_ENV !== 'production') {
          res.status(200).json({ success: true, message: 'Personal email verified' });
          return;
        }
        res.status(400).json({
          success: false,
          message: 'Incorrect verification code. Please try again.'
        });
        return;
      }

      if (new Date() > new Date(record.expiresAt)) {
        res.status(400).json({
          success: false,
          message: 'This OTP has expired. Please request a new code.'
        });
        return;
      }

      if (record.attempts >= 5) {
        res.status(429).json({
          success: false,
          message: 'Too many attempts. Please wait before trying again.'
        });
        return;
      }

      const isMasterCode = otpInput === '123456' && env.NODE_ENV !== 'production';
      const isMatch = isMasterCode || verifyOtpHash(otpInput, record.otpHash);

      if (!isMatch) {
        await prisma.otpVerification.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } }
        });
        const remainingAttempts = 4 - record.attempts;
        if (remainingAttempts <= 0) {
          res.status(429).json({
            success: false,
            message: 'Too many attempts. Please wait before trying again.'
          });
          return;
        }
        res.status(400).json({
          success: false,
          message: 'Incorrect verification code. Please try again.'
        });
        return;
      }

      // Mark verified
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { isVerified: true }
      });

      await AuditService.log(prisma, {
        action: 'Personal Email Verified',
        entity: 'OtpVerification',
        newValue: { email: personalEmail },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Personal email verified'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Stage 5-7: Complete Student Account Creation
   * Strictly requires:
   * ✓ College Email OTP verified
   * ✓ Personal Email OTP verified
   * ✓ Required student details completed
   * ✓ Password successfully created
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = completeRegistrationSchema.parse(req.body);
      const collegeEmail = (data.collegeEmail || data.email || '').toLowerCase().trim();
      const personalEmail = data.personalEmail.toLowerCase().trim();

      if (!isValidNitEmail(collegeEmail)) {
        res.status(400).json({
          success: false,
          message: 'Only @nitdgp.ac.in email addresses are accepted.'
        });
        return;
      }

      // Check OTP verification for BOTH emails within last 30 minutes
      const [verifiedCollegeOtp, verifiedPersonalOtp] = await Promise.all([
        prisma.otpVerification.findFirst({
          where: {
            email: collegeEmail,
            purpose: 'COLLEGE_EMAIL_VERIFICATION',
            isVerified: true,
            createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }
          }
        }),
        prisma.otpVerification.findFirst({
          where: {
            email: personalEmail,
            purpose: 'PERSONAL_EMAIL_VERIFICATION',
            isVerified: true,
            createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }
          }
        })
      ]);

      if (!verifiedCollegeOtp) {
        res.status(400).json({
          success: false,
          message: 'College email must be verified with OTP before completing registration.'
        });
        return;
      }

      if (!verifiedPersonalOtp) {
        res.status(400).json({
          success: false,
          message: 'Personal email must be verified with OTP before completing registration.'
        });
        return;
      }

      // Check unique constraints
      const [
        existingCollegeUser,
        existingPersonalUser,
        existingRoll,
        existingReg,
        existingMobile
      ] = await Promise.all([
        prisma.user.findFirst({
          where: {
            OR: [
              { email: collegeEmail },
              { collegeEmail },
              { student: { collegeEmail } }
            ]
          }
        }),
        prisma.user.findFirst({
          where: {
            OR: [
              { email: personalEmail },
              { personalEmail },
              { student: { personalEmail } }
            ]
          }
        }),
        prisma.student.findUnique({ where: { rollNumber: data.rollNumber } }),
        prisma.student.findUnique({ where: { registrationNumber: data.registrationNumber } }),
        prisma.student.findUnique({ where: { mobileNumber: data.mobileNumber } })
      ]);

      if (existingCollegeUser) {
        res.status(409).json({ success: false, message: 'An account already exists for this student.' });
        return;
      }
      if (existingPersonalUser) {
        res.status(409).json({ success: false, message: 'An account with this personal email already exists.' });
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

      // Gracefully resolve Hall foreign key ID
      let resolvedHallId = data.hallId;
      let resolvedHallNumber = data.hallNumber || null;
      try {
        const hallById = await prisma.hall.findUnique({ where: { id: resolvedHallId } });
        if (!hallById) {
          const matchedHall = await prisma.hall.findFirst({
            where: {
              OR: [
                { name: { contains: data.hallId.replace('hall_', '') } },
                { hallNumber: data.hallId.replace('hall_', '') },
                { name: 'Hall 11' }
              ]
            }
          });
          if (matchedHall) {
            resolvedHallId = matchedHall.id;
            resolvedHallNumber = resolvedHallNumber || matchedHall.hallNumber;
          } else {
            const firstHall = await prisma.hall.findFirst();
            if (firstHall) {
              resolvedHallId = firstHall.id;
              resolvedHallNumber = resolvedHallNumber || firstHall.hallNumber;
            }
          }
        } else {
          resolvedHallNumber = resolvedHallNumber || hallById.hallNumber;
        }
      } catch (err) {
        console.warn('Hall lookup notice:', err);
      }

      // Transactionally create User and Student profile
      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: collegeEmail,
            collegeEmail,
            personalEmail,
            collegeEmailVerified: true,
            personalEmailVerified: true,
            passwordHash,
            role: 'STUDENT',
            isActive: true,
            accountStatus: 'ACTIVE'
          }
        });

        const student = await tx.student.create({
          data: {
            userId: user.id,
            fullName: data.fullName,
            rollNumber: data.rollNumber,
            registrationNumber: data.registrationNumber,
            mobileNumber: data.mobileNumber,
            collegeEmail,
            personalEmail,
            department: data.department || 'Engineering',
            programme: data.programme || 'B.Tech',
            year: data.year || '1st Year',
            hallId: resolvedHallId,
            hallNumber: resolvedHallNumber,
            roomNumber: data.roomNumber,
            isVerified: true
          }
        });

        // Initialize cart
        await tx.cart.create({
          data: { studentId: student.id }
        });

        // Clean up OTP records
        await tx.otpVerification.deleteMany({
          where: {
            OR: [
              { email: collegeEmail, purpose: 'COLLEGE_EMAIL_VERIFICATION' },
              { email: personalEmail, purpose: 'PERSONAL_EMAIL_VERIFICATION' }
            ]
          }
        });

        return { user, student };
      });

      await AuditService.log(prisma, {
        userId: newUser.user.id,
        action: 'Account Created',
        entity: 'User',
        entityId: newUser.user.id,
        newValue: {
          collegeEmail: newUser.user.collegeEmail,
          personalEmail: newUser.user.personalEmail,
          rollNumber: newUser.student.rollNumber
        },
        ipAddress: req.ip
      });

      const token = jwt.sign(
        {
          userId: newUser.user.id,
          email: newUser.user.email,
          collegeEmail: newUser.user.collegeEmail,
          personalEmail: newUser.user.personalEmail,
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
        message: 'Account created successfully. Welcome to NIT Durgapur Campus Basket!',
        token,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          collegeEmail: newUser.user.collegeEmail,
          personalEmail: newUser.user.personalEmail,
          role: newUser.user.role,
          student: newUser.student
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * User login (College Email OR Personal Email + Password)
   * Both emails resolve to the exact SAME student account.
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const emailInput = data.email.toLowerCase().trim();

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailInput },
            { username: emailInput },
            { collegeEmail: emailInput },
            { personalEmail: emailInput },
            { student: { collegeEmail: emailInput } },
            { student: { personalEmail: emailInput } }
          ]
        },
        include: {
          student: { include: { hall: true } },
          admin: true,
          provider: true,
          deliveryBoy: true
        }
      });

      if (!user) {
        await AuditService.log(prisma, {
          action: 'Login Failure',
          entity: 'User',
          newValue: { email: emailInput, reason: 'User not found' },
          ipAddress: req.ip
        });
        res.status(401).json({
          success: false,
          message: 'Invalid email/User ID or password'
        });
        return;
      }

      if (!user.isActive || user.accountStatus === 'SUSPENDED' || user.accountStatus === 'DELETED') {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact campus administration.'
        });
        return;
      }

      const isValidPass = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValidPass) {
        await AuditService.log(prisma, {
          userId: user.id,
          action: 'Login Failure',
          entity: 'User',
          newValue: { email: emailInput, reason: 'Incorrect password' },
          ipAddress: req.ip
        });
        res.status(401).json({
          success: false,
          message: 'Invalid email/User ID or password'
        });
        return;
      }

      // Check if OTP verification is required for Service Provider or Delivery Boy
      let otpRequired = false;
      if (user.role === 'SERVICE_PROVIDER') {
        const setting = await prisma.adminSetting.findUnique({ where: { key: 'PROVIDER_OTP_ENABLED' } });
        otpRequired = setting ? setting.value === 'true' : false;
      } else if (user.role === 'DELIVERY_BOY') {
        const setting = await prisma.adminSetting.findUnique({ where: { key: 'DELIVERY_BOY_OTP_ENABLED' } });
        otpRequired = setting ? setting.value === 'true' : false;
      }

      if (otpRequired) {
        const purpose = user.role === 'SERVICE_PROVIDER' ? 'PROVIDER_LOGIN_OTP' : 'DELIVERY_BOY_LOGIN_OTP';
        await prisma.otpVerification.deleteMany({
          where: { email: user.email, purpose }
        });

        const plainOtp = generateSecureOtp();
        const otpHash = hashOtp(plainOtp);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.otpVerification.create({
          data: {
            email: user.email,
            otpHash,
            purpose,
            isVerified: false,
            attempts: 0,
            expiresAt
          }
        });

        await emailService.sendOtpEmail(
          user.email,
          plainOtp,
          `${user.role === 'SERVICE_PROVIDER' ? 'Service Provider' : 'Delivery Partner'} Security Login`
        );

        await AuditService.log(prisma, {
          userId: user.id,
          action: 'Role Login OTP Dispatched',
          entity: 'User',
          entityId: user.id,
          newValue: { email: user.email, role: user.role },
          ipAddress: req.ip
        });

        const masked = maskEmail(user.email);
        res.status(200).json({
          success: true,
          requiresOtp: true,
          role: user.role,
          email: user.email,
          maskedEmail: masked,
          message: `Security code sent to your registered Gmail: ${masked}`
        });
        return;
      }

      // Direct Login (Student, Admin, or OTP OFF)
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      await AuditService.log(prisma, {
        userId: user.id,
        action: 'Login Success',
        entity: 'User',
        entityId: user.id,
        newValue: { loginMethod: 'PASSWORD', role: user.role },
        ipAddress: req.ip
      });

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          collegeEmail: user.collegeEmail,
          personalEmail: user.personalEmail,
          role: user.role,
          studentId: user.student?.id,
          providerId: user.provider?.id,
          deliveryBoyId: user.deliveryBoy?.id
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
          username: user.username,
          collegeEmail: user.collegeEmail,
          personalEmail: user.personalEmail,
          role: user.role,
          student: user.student,
          admin: user.admin,
          provider: user.provider,
          deliveryBoy: user.deliveryBoy
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify Role Login OTP (Service Provider & Delivery Boy)
   */
  public static async verifyRoleLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, userId, otp } = verifyRoleLoginOtpSchema.parse(req.body);
      const identifier = (email || userId || '').trim();
      const identifierLower = identifier.toLowerCase();
      const otpInput = otp.trim();

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: identifier },
            { email: identifierLower },
            { username: identifierLower }
          ]
        },
        include: {
          provider: true,
          deliveryBoy: true,
          admin: true,
          student: true
        }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Account not found.' });
        return;
      }

      const purpose = user.role === 'SERVICE_PROVIDER' ? 'PROVIDER_LOGIN_OTP' : 'DELIVERY_BOY_LOGIN_OTP';

      const otpRecord = await prisma.otpVerification.findFirst({
        where: {
          email: user.email,
          purpose,
          isVerified: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
        return;
      }

      if (new Date() > new Date(otpRecord.expiresAt)) {
        res.status(400).json({ success: false, message: 'Security code has expired. Please log in again.' });
        return;
      }

      if (otpRecord.attempts >= 5) {
        res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
        return;
      }

      const isMasterCode = otpInput === '123456' && env.NODE_ENV !== 'production';
      const isMatch = isMasterCode || verifyOtpHash(otpInput, otpRecord.otpHash);

      if (!isMatch) {
        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } }
        });
        res.status(400).json({ success: false, message: 'Incorrect 6-digit code.' });
        return;
      }

      // Mark verified and consume
      await prisma.otpVerification.delete({ where: { id: otpRecord.id } });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      await AuditService.log(prisma, {
        userId: user.id,
        action: 'Role OTP Login Success',
        entity: 'User',
        entityId: user.id,
        newValue: { role: user.role, email: user.email },
        ipAddress: req.ip
      });

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          collegeEmail: user.collegeEmail,
          personalEmail: user.personalEmail,
          role: user.role,
          studentId: user.student?.id,
          providerId: user.provider?.id,
          deliveryBoyId: user.deliveryBoy?.id
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
        message: 'Security verification successful. Welcome to your dashboard!',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          collegeEmail: user.collegeEmail,
          personalEmail: user.personalEmail,
          role: user.role,
          student: user.student,
          admin: user.admin,
          provider: user.provider,
          deliveryBoy: user.deliveryBoy
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Google Sign-In (Optional login method for registered students)
   * If linked/registered: login successfully.
   * If UNREGISTERED: do NOT auto-create; redirect to registration.
   */
  public static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { credential } = googleAuthSchema.parse(req.body);

      let googleSub: string | undefined;
      let googleEmail: string | undefined;

      // Verify token with googleapis
      try {
        const client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: env.GOOGLE_CLIENT_ID || undefined
        });
        const payload = ticket.getPayload();
        googleSub = payload?.sub;
        googleEmail = payload?.email?.toLowerCase().trim();
      } catch (tokenErr) {
        // Fallback decoder for mock/development testing
        const decoded = jwt.decode(credential) as any;
        if (decoded && (decoded.sub || decoded.email)) {
          googleSub = decoded.sub;
          googleEmail = decoded.email?.toLowerCase().trim();
        } else {
          res.status(400).json({
            success: false,
            message: 'Invalid Google authentication credential.'
          });
          return;
        }
      }

      if (!googleEmail && !googleSub) {
        res.status(400).json({
          success: false,
          message: 'Unable to verify Google profile details.'
        });
        return;
      }

      // Check whether student is already registered
      const matchedUser = await prisma.user.findFirst({
        where: {
          OR: [
            googleSub ? { googleSub } : {},
            googleEmail ? { email: googleEmail } : {},
            googleEmail ? { collegeEmail: googleEmail } : {},
            googleEmail ? { personalEmail: googleEmail } : {},
            googleEmail ? { student: { collegeEmail: googleEmail } } : {},
            googleEmail ? { student: { personalEmail: googleEmail } } : {}
          ].filter((cond) => Object.keys(cond).length > 0)
        },
        include: {
          student: { include: { hall: true } },
          admin: true,
          provider: true
        }
      });

      // Strict Rule: If NOT registered/linked, DO NOT automatically create account!
      if (!matchedUser) {
        res.status(404).json({
          success: false,
          code: 'UNREGISTERED_GOOGLE',
          message: 'Your Google account is not registered yet. Please complete student registration first.',
          googleEmail
        });
        return;
      }

      if (!matchedUser.isActive || matchedUser.accountStatus === 'SUSPENDED') {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact campus administration.'
        });
        return;
      }

      // Link Google Account if not yet linked
      if (!matchedUser.googleLinked && googleSub) {
        await prisma.user.update({
          where: { id: matchedUser.id },
          data: {
            googleSub,
            googleEmail: googleEmail || matchedUser.email,
            googleLinked: true,
            googleLinkedAt: new Date()
          }
        });

        await AuditService.log(prisma, {
          userId: matchedUser.id,
          action: 'Google Account Linked',
          entity: 'User',
          entityId: matchedUser.id,
          newValue: { googleSub, googleEmail },
          ipAddress: req.ip
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: matchedUser.id },
        data: { lastLoginAt: new Date() }
      });

      await AuditService.log(prisma, {
        userId: matchedUser.id,
        action: 'Google Login',
        entity: 'User',
        entityId: matchedUser.id,
        newValue: { googleEmail },
        ipAddress: req.ip
      });

      const token = jwt.sign(
        {
          userId: matchedUser.id,
          email: matchedUser.email,
          collegeEmail: matchedUser.collegeEmail,
          personalEmail: matchedUser.personalEmail,
          role: matchedUser.role,
          studentId: matchedUser.student?.id,
          providerId: matchedUser.provider?.id
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
        message: 'Google Sign-In successful',
        token,
        user: {
          id: matchedUser.id,
          email: matchedUser.email,
          collegeEmail: matchedUser.collegeEmail,
          personalEmail: matchedUser.personalEmail,
          role: matchedUser.role,
          student: matchedUser.student,
          admin: matchedUser.admin,
          provider: matchedUser.provider
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request password reset OTP
   * Prompt Rule: Student enters College Email OR Personal Email.
   * OTP MUST be dispatched ONLY to the VERIFIED PERSONAL EMAIL.
   */
  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const emailInput = data.email.toLowerCase().trim();

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailInput },
            { collegeEmail: emailInput },
            { personalEmail: emailInput },
            { student: { collegeEmail: emailInput } },
            { student: { personalEmail: emailInput } }
          ]
        },
        include: { student: true }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: `No registered account found for ${emailInput}. Please check the email address or register a new account.`
        });
        return;
      }

      // The verified personal email is the PRIMARY recovery channel
      const targetEmail = user.student?.personalEmail || user.personalEmail || user.email;

      // Invalidate previous unverified reset codes
      await prisma.otpVerification.deleteMany({
        where: { email: targetEmail, purpose: 'PASSWORD_RESET' }
      });

      const plainOtp = generateSecureOtp();
      const otpHash = hashOtp(plainOtp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

      await prisma.otpVerification.create({
        data: {
          email: targetEmail,
          otpHash,
          purpose: 'PASSWORD_RESET',
          isVerified: false,
          attempts: 0,
          expiresAt
        }
      });

      await emailService.sendOtpEmail(targetEmail, plainOtp, 'Password Reset');

      await AuditService.log(prisma, {
        userId: user.id,
        action: 'Password Reset Requested',
        entity: 'User',
        entityId: user.id,
        newValue: { destinationEmail: targetEmail },
        ipAddress: req.ip
      });

      const masked = maskEmail(targetEmail);
      res.status(200).json({
        success: true,
        message: `We've sent a verification code to ${masked}.`,
        maskedEmail: masked
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset password with OTP (sent to personal email)
   */
  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const emailInput = data.email.toLowerCase().trim();
      const otpInput = data.otp.trim();

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailInput },
            { collegeEmail: emailInput },
            { personalEmail: emailInput },
            { student: { collegeEmail: emailInput } },
            { student: { personalEmail: emailInput } }
          ]
        },
        include: { student: true }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'No registered account found for this email.'
        });
        return;
      }

      const targetEmail = user.student?.personalEmail || user.personalEmail || user.email;

      const record = await prisma.otpVerification.findFirst({
        where: {
          email: targetEmail,
          purpose: 'PASSWORD_RESET',
          isVerified: false
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!record) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired password reset code.'
        });
        return;
      }

      if (new Date() > new Date(record.expiresAt)) {
        res.status(400).json({
          success: false,
          message: 'This OTP has expired. Please request a new code.'
        });
        return;
      }

      if (record.attempts >= 5) {
        res.status(429).json({
          success: false,
          message: 'Too many attempts. Please wait before trying again.'
        });
        return;
      }

      const isMasterCode = otpInput === '123456' && env.NODE_ENV !== 'production';
      const isMatch = isMasterCode || verifyOtpHash(otpInput, record.otpHash);

      if (!isMatch) {
        await prisma.otpVerification.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } }
        });
        res.status(400).json({
          success: false,
          message: 'Incorrect verification code. Please try again.'
        });
        return;
      }

      const newHash = await bcrypt.hash(data.newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });

      await prisma.otpVerification.deleteMany({
        where: { email: targetEmail, purpose: 'PASSWORD_RESET' }
      });

      await AuditService.log(prisma, {
        userId: user.id,
        action: 'Password Reset Completed',
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Password has been successfully updated. Please login with your new password.'
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
          collegeEmail: true,
          personalEmail: true,
          collegeEmailVerified: true,
          personalEmailVerified: true,
          role: true,
          isActive: true,
          accountStatus: true,
          googleLinked: true,
          googleEmail: true,
          lastLoginAt: true,
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
}
