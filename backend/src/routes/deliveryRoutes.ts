import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController';
import { ReturnController } from '../controllers/returnController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const router = Router();

router.use(authGuard);
router.use(rbacGuard(['ADMIN', 'DELIVERY_BOY']));

router.get('/dashboard', DeliveryController.getDashboard);
router.get('/earnings', DeliveryController.getEarnings);
router.get('/earnings/pdf', DeliveryController.downloadRunnerStatementPdf);
router.get('/payout-account', DeliveryController.getPayoutAccount);
router.post('/payout-account', DeliveryController.savePayoutAccount);
router.get('/withdrawals', DeliveryController.getWithdrawals);
router.post('/withdrawals', DeliveryController.requestWithdrawal);
router.get('/available', DeliveryController.getAvailableOrders);
router.get('/orders', DeliveryController.getAssignedOrders);
router.get('/history', DeliveryController.getDeliveryHistory);
router.post('/orders/:id/accept', DeliveryController.acceptOrder);
router.post('/orders/:id/reject', DeliveryController.rejectOrder);
router.post('/orders/:id/verify-otp', DeliveryController.verifyDeliveryOtp);
router.post('/returns/:id/verify-otp', ReturnController.verifyReturnPickupOtp);
router.patch('/orders/:id/status', DeliveryController.updateDeliveryStatus);
router.patch('/status', DeliveryController.toggleOnlineStatus);

export default router;
