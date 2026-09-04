import { Router } from 'express';
import { ImageController } from '../controllers/imageController';

const router = Router();

// Publicly streamable via backend proxy without exposing Google Drive service account secrets
router.get('/preview/:fileId', ImageController.previewImage);

export default router;
