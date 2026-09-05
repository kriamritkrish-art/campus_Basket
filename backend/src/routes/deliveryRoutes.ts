import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const router = Router();

router.use(authGuard);
router.use(rbacGuard(['ADMIN', 'DELIVERY_BOY']));

router.get('/dashboard', DeliveryController.getDashboard);
router.get('/orders', DeliveryController.getAssignedOrders);
router.get('/history', DeliveryController.getDeliveryHistory);
router.patch('/orders/:id/status', DeliveryController.updateDeliveryStatus);

export default router;
