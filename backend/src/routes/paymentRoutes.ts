import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

// Webhook does NOT use JWT auth guard because it is called by Razorpay servers
router.post('/webhook', PaymentController.webhook);

// Verifying checkout payment signature
router.post('/verify', authGuard, PaymentController.verifyPayment);

// Downloading receipt
router.get('/receipt/:receiptNumber', PaymentController.getReceipt);

export default router;
