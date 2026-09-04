import { Router } from 'express';
import { ProductController } from '../controllers/productController';

const router = Router();

router.get('/', ProductController.getProducts);
router.get('/categories', ProductController.getCategories);
router.get('/:slug', ProductController.getProductBySlug);

export default router;
