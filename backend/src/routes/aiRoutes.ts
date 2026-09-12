import { Router } from 'express';
import { AiController } from '../controllers/aiController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const router = Router();

// Public / Student configuration check
router.get('/config', AiController.getPublicConfig);

// Hybrid / Server query (guarded by quota & status)
router.post('/query', AiController.handleAiQuery);

// Admin-Only Governance & Usage Controls
router.get('/admin/settings', authGuard, rbacGuard(['ADMIN']), AiController.getAdminSettings);
router.post('/admin/settings', authGuard, rbacGuard(['ADMIN']), AiController.updateAdminSettings);

export default router;
