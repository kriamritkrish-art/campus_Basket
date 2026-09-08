import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';
import { geofenceGuard } from '../middleware/geofenceGuard';

const router = Router();

// Public platform order policies (Accessible by students, guests, and checkout)
router.get('/policies', OrderController.getOrderPolicies);

router.use(authGuard);

// Placing an order requires geofence verification within campus
router.post('/', rbacGuard(['STUDENT', 'ADMIN']), geofenceGuard, OrderController.createOrder);
router.get('/', rbacGuard(['STUDENT', 'ADMIN']), OrderController.getStudentOrders);
router.get('/refund-account', rbacGuard(['STUDENT', 'ADMIN']), OrderController.getRefundAccount);
router.post('/refund-account', rbacGuard(['STUDENT', 'ADMIN']), OrderController.saveRefundAccount);
router.get('/:id', OrderController.getOrderById);
router.put('/:id/modify', rbacGuard(['STUDENT', 'ADMIN']), OrderController.modifyOrder);
router.patch('/:id/modify', rbacGuard(['STUDENT', 'ADMIN']), OrderController.modifyOrder);
router.post('/:id/add-items', rbacGuard(['STUDENT', 'ADMIN']), OrderController.modifyOrder);
router.post('/:id/cancel', rbacGuard(['STUDENT', 'ADMIN']), OrderController.cancelOrder);
router.get('/:id/return', rbacGuard(['STUDENT', 'ADMIN', 'DELIVERY_BOY']), OrderController.getOrderReturn);
router.post('/:id/return', rbacGuard(['STUDENT', 'ADMIN']), OrderController.requestReturn);

export default router;
