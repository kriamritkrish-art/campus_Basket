import { Router } from 'express';
import { LaundryController } from '../controllers/laundryController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';
import { geofenceGuard } from '../middleware/geofenceGuard';

const router = Router();

// Public / pre-auth pricing endpoint
router.get('/pricing', LaundryController.getPricing);

router.use(authGuard);

// Student booking & order history
router.post('/orders', rbacGuard(['STUDENT']), geofenceGuard, LaundryController.createOrder);
router.get('/orders', rbacGuard(['STUDENT', 'ADMIN']), LaundryController.getStudentLaundryOrders);
router.get('/orders/:id', LaundryController.getOrderDetail);
router.post('/orders/:id/cancel', LaundryController.cancelOrder);

// Provider and student actions (OTP verification & status)
router.post('/:id/accept', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.acceptOrder);
router.post('/orders/:id/accept', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.acceptOrder);
router.post('/:id/verify-pickup', rbacGuard(['ADMIN', 'SERVICE_PROVIDER', 'STUDENT']), LaundryController.verifyPickupOtp);
router.post('/:id/verify-pickup-otp', rbacGuard(['ADMIN', 'SERVICE_PROVIDER', 'STUDENT']), LaundryController.verifyPickupOtp);
router.post('/:id/verify-delivery', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.verifyDeliveryOtp);
router.post('/:id/verify-delivery-otp', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.verifyDeliveryOtp);
router.post('/:id/condition', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.recordCondition);
router.patch('/:id/status', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.updateStatus);

// COD cash collection
router.post('/:id/collect-cod', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.markCodCollected);
router.post('/:id/cod-collect', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.markCodCollected);
router.post('/orders/:id/collect-cod', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.markCodCollected);

// Laundry Complaints & Support
router.post('/complaints', rbacGuard(['STUDENT', 'ADMIN']), LaundryController.createComplaint);
router.get('/complaints', rbacGuard(['STUDENT', 'ADMIN']), LaundryController.getStudentComplaints);

export default router;
