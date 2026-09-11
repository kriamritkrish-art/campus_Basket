import { Router } from 'express';
import multer from 'multer';
import { ProviderController } from '../controllers/providerController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const imageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are permitted.'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

const router = Router();

router.use(authGuard);
router.use(rbacGuard(['ADMIN', 'SERVICE_PROVIDER']));

router.get('/dashboard', ProviderController.getDashboard);
router.get('/analytics', ProviderController.getAnalytics);
router.get('/export', ProviderController.exportData);
router.get('/settlements', ProviderController.getSettlements);
router.post('/settlements/request', ProviderController.requestSettlement);
router.get('/settlement-account', ProviderController.getSettlementAccount);
router.post('/settlement-account', ProviderController.saveSettlementAccount);
router.get('/laundry-config', ProviderController.getLaundryConfig);
router.post('/laundry-config', ProviderController.saveLaundryConfig);
router.get('/payment-scanner', ProviderController.getPaymentScanner);
router.post('/payment-scanner', ProviderController.savePaymentScanner);
router.get('/products', ProviderController.getProducts);
router.post('/products', upload.single('image'), ProviderController.createProduct);
router.patch('/products/:id', ProviderController.updateProduct);
router.get('/orders', ProviderController.getOrders);
router.patch('/orders/:id/status', ProviderController.updateOrderStatus);

export default router;
