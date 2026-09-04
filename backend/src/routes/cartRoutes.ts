import { Router } from 'express';
import { CartController } from '../controllers/cartController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const router = Router();

// All cart operations require authenticated student
router.use(authGuard);
router.use(rbacGuard(['STUDENT']));

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.patch('/items/:id', CartController.updateQuantity);
router.delete('/items/:id', CartController.removeItem);
router.delete('/', CartController.clearCart);

export default router;
