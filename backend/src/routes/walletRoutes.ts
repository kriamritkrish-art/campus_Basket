import { Router } from 'express';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';
import { WalletService } from '../services/financial/WalletService';
import { resolveStudentProfile } from '../controllers/orderController';

const router = Router();

router.use(authGuard);

/**
 * Get student Campus Basket Wallet balance and transaction history
 */
router.get('/', rbacGuard(['STUDENT', 'ADMIN']), async (req, res, next) => {
  try {
    const student = await resolveStudentProfile(req.user);
    const studentId = student?.id || (req.user?.role === 'ADMIN' ? (req.query.studentId as string) : null);
    if (!studentId) {
      res.status(403).json({ success: false, message: 'Student profile required' });
      return;
    }
    const data = await WalletService.getWallet(studentId);
    res.status(200).json({
      success: true,
      wallet: data.wallet,
      balance: data.wallet.balance,
      transactions: data.transactions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Get student wallet transaction ledger
 */
router.get('/transactions', rbacGuard(['STUDENT', 'ADMIN']), async (req, res, next) => {
  try {
    const student = await resolveStudentProfile(req.user);
    const studentId = student?.id || (req.user?.role === 'ADMIN' ? (req.query.studentId as string) : null);
    if (!studentId) {
      res.status(403).json({ success: false, message: 'Student profile required' });
      return;
    }
    const data = await WalletService.getWallet(studentId);
    res.status(200).json({
      success: true,
      transactions: data.transactions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Spend wallet balance on campus order checkout
 */
router.post('/pay', rbacGuard(['STUDENT', 'ADMIN']), async (req, res, next) => {
  try {
    const { orderId, amount, description } = req.body;
    const student = await resolveStudentProfile(req.user);
    const studentId = student?.id;
    if (!studentId) {
      res.status(403).json({ success: false, message: 'Student profile required' });
      return;
    }
    const result = await WalletService.debitPayment({
      studentId,
      orderId,
      amount: Number(amount),
      description
    });
    res.status(200).json({
      success: true,
      message: `₹${result.debitedAmount.toFixed(2)} debited from Campus Basket Wallet.`,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err?.message || 'Wallet payment failed'
    });
  }
});

/**
 * Initiate wallet top-up via Razorpay gateway order
 */
router.post('/topup/initiate', rbacGuard(['STUDENT', 'ADMIN']), async (req, res, next) => {
  try {
    const { amount } = req.body;
    const student = await resolveStudentProfile(req.user);
    const studentId = student?.id;
    if (!studentId) {
      res.status(403).json({ success: false, message: 'Student profile required' });
      return;
    }
    const orderData = await WalletService.initiateTopUp(studentId, Number(amount));
    res.status(200).json({
      success: true,
      message: 'Wallet top-up order initialized',
      ...orderData
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err?.message || 'Failed to initialize wallet top-up'
    });
  }
});

/**
 * Verify Razorpay payment signature and credit student wallet
 */
router.post('/topup/verify', rbacGuard(['STUDENT', 'ADMIN']), async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;
    const student = await resolveStudentProfile(req.user);
    const studentId = student?.id;
    if (!studentId) {
      res.status(403).json({ success: false, message: 'Student profile required' });
      return;
    }

    const result = await WalletService.verifyAndCreditTopUp({
      studentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount: Number(amount)
    });

    res.status(200).json({
      success: true,
      message: `₹${Number(amount).toFixed(2)} added to Campus Basket Wallet successfully!`,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err?.message || 'Payment signature verification failed'
    });
  }
});

export default router;
