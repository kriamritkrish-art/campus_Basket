import { Router } from 'express';
import { ReturnController } from '../controllers/returnController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const router = Router();

router.use(authGuard);

// Delivery Boy / Admin OTP verification
router.post('/:id/verify-otp', rbacGuard(['ADMIN', 'DELIVERY_BOY']), ReturnController.verifyReturnPickupOtp);

// Get single return request
router.get('/:id', rbacGuard(['STUDENT', 'ADMIN', 'DELIVERY_BOY']), ReturnController.getReturnById);

// Admin operations
router.get('/', rbacGuard(['ADMIN']), ReturnController.getAllReturns);
router.post('/:id/approve', rbacGuard(['ADMIN']), ReturnController.approveReturn);
router.post('/:id/reject', rbacGuard(['ADMIN']), ReturnController.rejectReturn);
router.post('/:id/assign-delivery', rbacGuard(['ADMIN']), ReturnController.assignDeliveryBoy);
router.post('/:id/disburse-refund', rbacGuard(['ADMIN']), ReturnController.disburseReturnRefund);
router.post('/:id/request-account-details', rbacGuard(['ADMIN']), ReturnController.requestAccountDetails);

export default router;
