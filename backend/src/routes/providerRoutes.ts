import { Router } from 'express';
import { ProviderController } from '../controllers/providerController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const router = Router();

router.use(authGuard);
router.use(rbacGuard(['ADMIN', 'SERVICE_PROVIDER']));

router.get('/dashboard', ProviderController.getDashboard);
router.patch('/orders/:id/status', ProviderController.updateOrderStatus);

export default router;
