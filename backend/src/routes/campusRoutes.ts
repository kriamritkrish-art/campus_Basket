import { Router } from 'express';
import { ZoneController } from '../controllers/zoneController';
import { HallController } from '../controllers/hallController';
import { SupportController } from '../controllers/supportController';
import { EngagementController } from '../controllers/engagementController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const router = Router();

// Publicly readable campus data
router.get('/halls', HallController.getHalls);
router.get('/zones', ZoneController.getZones);
router.get('/announcements', EngagementController.getAnnouncements);
router.post('/coupons/validate', EngagementController.validateCoupon);

// Authenticated Student actions
router.post('/favorites/toggle', authGuard, EngagementController.toggleFavorite);
router.post('/reviews', authGuard, rbacGuard(['STUDENT']), EngagementController.createReview);
router.post('/support/tickets', authGuard, rbacGuard(['STUDENT']), SupportController.createTicket);
router.get('/support/tickets', authGuard, rbacGuard(['STUDENT']), SupportController.getStudentTickets);

// Admin operations
router.post('/zones', authGuard, rbacGuard(['ADMIN']), ZoneController.saveZone);
router.post('/halls', authGuard, rbacGuard(['ADMIN']), HallController.saveHall);
router.get('/support/admin/tickets', authGuard, rbacGuard(['ADMIN']), SupportController.getAllTickets);
router.patch('/support/admin/tickets/:id', authGuard, rbacGuard(['ADMIN']), SupportController.resolveTicket);

export default router;
