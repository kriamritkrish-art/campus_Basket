import { Router } from 'express';
import multer from 'multer';
import { ProviderController } from '../controllers/providerController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.use(authGuard);
router.use(rbacGuard(['ADMIN', 'SERVICE_PROVIDER']));

router.get('/dashboard', ProviderController.getDashboard);
router.get('/analytics', ProviderController.getAnalytics);
router.get('/export', ProviderController.exportData);
router.get('/products', ProviderController.getProducts);
router.post('/products', upload.single('image'), ProviderController.createProduct);
router.patch('/products/:id', ProviderController.updateProduct);
router.get('/orders', ProviderController.getOrders);
router.patch('/orders/:id/status', ProviderController.updateOrderStatus);

export default router;
