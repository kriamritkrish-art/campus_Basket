import { Router } from 'express';
import { LaundryController } from '../controllers/laundryController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';
import { geofenceGuard } from '../middleware/geofenceGuard';

const router = Router();

router.use(authGuard);

// Student booking & history
router.post('/orders', rbacGuard(['STUDENT']), geofenceGuard, LaundryController.createOrder);
router.get('/orders', rbacGuard(['STUDENT']), LaundryController.getStudentLaundryOrders);

// Provider actions (OTP verification & status)
router.post('/:id/verify-pickup', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.verifyPickupOtp);
router.post('/:id/verify-delivery', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.verifyDeliveryOtp);
router.post('/:id/condition', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.recordCondition);
router.patch('/:id/status', rbacGuard(['ADMIN', 'SERVICE_PROVIDER']), LaundryController.updateStatus);

export default router;
