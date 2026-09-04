import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';
import { geofenceGuard } from '../middleware/geofenceGuard';

const router = Router();

router.use(authGuard);

// Placing an order requires geofence verification within campus
router.post('/', rbacGuard(['STUDENT']), geofenceGuard, OrderController.createOrder);
router.get('/', rbacGuard(['STUDENT']), OrderController.getStudentOrders);
router.get('/:id', OrderController.getOrderById);
router.post('/:id/cancel', rbacGuard(['STUDENT']), OrderController.cancelOrder);

export default router;
