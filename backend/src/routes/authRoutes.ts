import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authGuard } from '../middleware/authGuard';
import { otpRequestLimiter, loginLimiter } from '../middleware/rateLimiter';

const router = Router();

// Stage 1 & 2: College Email Verification
router.post('/college/send-otp', otpRequestLimiter, AuthController.sendCollegeOtp);
router.post('/college/verify-otp', AuthController.verifyCollegeOtp);
router.post('/send-otp', otpRequestLimiter, AuthController.sendCollegeOtp);
router.post('/verify-otp', AuthController.verifyCollegeOtp);

// Stage 3 & 4: Personal Email Verification
router.post('/personal/send-otp', otpRequestLimiter, AuthController.sendPersonalOtp);
router.post('/personal/verify-otp', AuthController.verifyPersonalOtp);

// Stage 5-7: Complete Registration
router.post('/register/complete', AuthController.register);
router.post('/register', AuthController.register);

// Authentication & Session
router.post('/login', loginLimiter, AuthController.login);
router.post('/login/verify-otp', AuthController.verifyRoleLoginOtp);
router.post('/google', AuthController.googleAuth);
router.post('/logout', AuthController.logout);
router.get('/me', authGuard, AuthController.getMe);
router.put('/profile', authGuard, AuthController.updateProfile);

// Password Recovery (Routes to verified personal email)
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
