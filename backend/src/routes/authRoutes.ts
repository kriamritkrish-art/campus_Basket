import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authGuard } from '../middleware/authGuard';
import { otpRequestLimiter, loginLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/send-otp', otpRequestLimiter, AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/register', AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authGuard, AuthController.getMe);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
