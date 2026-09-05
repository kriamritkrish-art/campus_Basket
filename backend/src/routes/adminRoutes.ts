import { Router } from 'express';
import multer from 'multer';
import { AdminController } from '../controllers/adminController';
import { AdminServicesController } from '../controllers/adminServicesController';
import { AdminAnalyticsController } from '../controllers/adminAnalyticsController';
import { AdminReportController } from '../controllers/adminReportController';
import { AdminPeopleController } from '../controllers/adminPeopleController';
import { AdminCampusController } from '../controllers/adminCampusController';
import { authGuard } from '../middleware/authGuard';
import { rbacGuard } from '../middleware/rbacGuard';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

const router = Router();

// Strict Authentication & RBAC Guard: ADMIN Only
router.use(authGuard);
router.use(rbacGuard(['ADMIN']));

// 1. Dashboard Executive Overview & KPIs
router.get('/dashboard', AdminController.getDashboardMetrics);

// 2. Commerce: Products & Inventory
router.get('/products', AdminController.getAllProducts);
router.get('/products/pending', AdminController.getPendingProducts);
router.patch('/products/:id/approve', AdminController.approveProduct);
router.patch('/products/:id/reject', AdminController.rejectProduct);
router.post('/products', upload.single('image'), AdminController.createProduct);
router.patch('/products/:id', AdminController.updateProduct);
router.post('/products/:id/image', upload.single('image'), AdminController.uploadProductImage);
router.get('/products/:id/analytics', AdminController.getProductAnalytics);

router.get('/inventory', AdminController.getInventory);
router.patch('/inventory/:id', AdminController.updateStock);

// 3. Commerce: Orders & Refunds
router.get('/orders', AdminController.getAllOrders);
router.get('/orders/:id', AdminController.getOrderDetails);
router.patch('/orders/:id/status', AdminController.updateOrderStatus);
router.post('/orders/:id/assign', AdminController.assignProvider);
router.post('/orders/:id/assign-delivery', AdminPeopleController.assignDeliveryBoy);
router.post('/orders/refund', AdminController.processRefund);
router.get('/orders/:id/receipt', AdminReportController.downloadReceipt);

// 4. Primary Services Management
router.get('/services/food', AdminServicesController.getFoodAndMeals);
router.get('/services/fruits', AdminServicesController.getFreshFruits);
router.get('/services/laundry', AdminServicesController.getExpressLaundry);
router.patch('/services/laundry/:id/status', AdminServicesController.updateLaundryStatus);
router.get('/services/essentials', AdminServicesController.getStationeryAndEssentials);

// 5. Power BI-Style Analytics
router.get('/analytics/overview', AdminAnalyticsController.getOverview);
router.get('/analytics/category/:categoryId', AdminAnalyticsController.getCategoryDrilldown);

// 6. Reports, Receipts & CSV Exports
router.post('/reports/generate', AdminReportController.generateReport);
router.get('/reports/history', AdminReportController.getReportHistory);
router.get('/reports/export-csv', AdminReportController.exportCsv);

// 7. People: Students, Providers, Delivery Boys, Halls
router.get('/students', AdminPeopleController.getStudents);
router.patch('/students/:id/status', AdminPeopleController.toggleStudentActive);
router.delete('/students/:id', AdminPeopleController.deleteStudent);

router.get('/providers', AdminPeopleController.getProviders);
router.post('/providers', AdminPeopleController.createProvider);
router.patch('/providers/:id', AdminPeopleController.updateProvider);
router.delete('/providers/:id', AdminPeopleController.deleteProvider);
router.patch('/providers/:id/status', AdminPeopleController.toggleProviderActive);
router.get('/providers/:id/details', AdminPeopleController.getProviderDetails);
router.get('/providers/:providerId/analytics', AdminController.getProviderSalesAnalytics);

router.get('/delivery-boys', AdminPeopleController.getDeliveryBoys);
router.post('/delivery-boys', AdminPeopleController.createDeliveryBoy);
router.patch('/delivery-boys/:id', AdminPeopleController.updateDeliveryBoy);
router.delete('/delivery-boys/:id', AdminPeopleController.deleteDeliveryBoy);

router.get('/halls', AdminPeopleController.getHalls);
router.post('/halls', AdminPeopleController.createHall);

// 8. Campus & Marketing
router.get('/zones', AdminCampusController.getZones);
router.post('/zones', AdminCampusController.createZone);

router.get('/categories', AdminCampusController.getCategories);
router.post('/categories', AdminCampusController.createCategory);

router.get('/coupons', AdminCampusController.getCoupons);
router.post('/coupons', AdminCampusController.createCoupon);

router.get('/announcements', AdminCampusController.getAnnouncements);
router.post('/announcements', AdminCampusController.createAnnouncement);

router.get('/campus/hours', AdminCampusController.getBusinessHours);
router.post('/campus/hours', AdminCampusController.updateBusinessHours);

// 9. System: Support, Audit & Settings
router.get('/support/tickets', AdminPeopleController.getSupportTickets);
router.patch('/support/tickets/:id', AdminPeopleController.replySupportTicket);

router.get('/audit-logs', AdminPeopleController.getAuditLogs);

router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.updateSetting);
router.get('/settings/auth-otp', AdminController.getAuthSettings);
router.post('/settings/auth-otp', AdminController.updateAuthSettings);

export default router;
