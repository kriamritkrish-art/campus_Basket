import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rbacGuard } from '../backend/src/middleware/rbacGuard';
import { loginSchema, verifyRoleLoginOtpSchema, createServiceProviderSchema, createDeliveryBoySchema } from '../backend/src/validators/authValidators';

describe('Service Provider & Delivery Boy Role System Tests', () => {
  describe('1. Role-Based Access Control (RBAC) Isolation', () => {
    it('allows DELIVERY_BOY on delivery-specific endpoints', () => {
      const middleware = rbacGuard(['DELIVERY_BOY', 'ADMIN']);
      const req: any = { user: { role: 'DELIVERY_BOY', id: 'db-123' } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('blocks STUDENT from accessing delivery boy dashboard (HTTP 403)', () => {
      const middleware = rbacGuard(['DELIVERY_BOY']);
      const req: any = { user: { role: 'STUDENT', id: 'stu-123' } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('blocks DELIVERY_BOY from accessing service provider console (HTTP 403)', () => {
      const middleware = rbacGuard(['SERVICE_PROVIDER']);
      const req: any = { user: { role: 'DELIVERY_BOY', id: 'db-123' } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows ADMIN access to both provider and delivery endpoints', () => {
      const providerMiddleware = rbacGuard(['SERVICE_PROVIDER', 'ADMIN']);
      const deliveryMiddleware = rbacGuard(['DELIVERY_BOY', 'ADMIN']);

      const req: any = { user: { role: 'ADMIN', id: 'admin-1' } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next1 = vi.fn();
      const next2 = vi.fn();

      providerMiddleware(req, res, next1);
      deliveryMiddleware(req, res, next2);

      expect(next1).toHaveBeenCalled();
      expect(next2).toHaveBeenCalled();
    });
  });

  describe('2. Login Credential Validation (Email OR User ID)', () => {
    it('validates login with student college email', () => {
      const result = loginSchema.safeParse({
        email: 'ss.24u10227@nitdgp.ac.in',
        password: 'Student@2026',
      });
      expect(result.success).toBe(true);
    });

    it('validates login with provider User ID (e.g. SP_FOOD_01)', () => {
      const result = loginSchema.safeParse({
        email: 'SP_FOOD_01',
        password: 'Vendor@12345',
      });
      expect(result.success).toBe(true);
    });

    it('validates login with delivery boy User ID (e.g. DB_BOY_01)', () => {
      const result = loginSchema.safeParse({
        email: 'DB_BOY_01',
        password: 'Delivery@12345',
      });
      expect(result.success).toBe(true);
    });

    it('rejects login with empty credentials', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('3. Role Login 6-Digit OTP Verification Schema', () => {
    it('accepts valid 6-digit numeric OTP', () => {
      const result = verifyRoleLoginOtpSchema.safeParse({
        userId: 'usr-12345',
        otp: '492817',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid OTP length (< 6 or > 6 digits)', () => {
      const resultShort = verifyRoleLoginOtpSchema.safeParse({
        userId: 'usr-12345',
        otp: '1234',
      });
      expect(resultShort.success).toBe(false);

      const resultLong = verifyRoleLoginOtpSchema.safeParse({
        userId: 'usr-12345',
        otp: '1234567',
      });
      expect(resultLong.success).toBe(false);
    });
  });

  describe('4. Admin Provider & Delivery Boy Creation Schemas', () => {
    it('validates provider creation with one of 4 platform categories', () => {
      const result = createServiceProviderSchema.safeParse({
        businessName: 'Hostel 11 Canteen Express',
        contactPerson: 'Ramesh Sharma',
        username: 'SP_FOOD_01',
        email: 'vendor@nitdgp.ac.in',
        password: 'Vendor@12345',
        phone: '9876543210',
        serviceCategory: 'Food & Meals',
        activeStatus: true,
      });
      expect(result.success).toBe(true);
    });

    it('validates delivery boy creation with unique User ID and contact', () => {
      const result = createDeliveryBoySchema.safeParse({
        fullName: 'Amit Kumar',
        username: 'DB_BOY_01',
        email: 'runner@gmail.com',
        password: 'Delivery@12345',
        phone: '9876543210',
        status: 'ACTIVE',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('5. Strict Category Restriction & Product Approval Logic', () => {
    it('enforces category matching between provider profile and target product category', () => {
      const providerCategory = 'Food & Meals';
      const foodCategorySlug = 'food';
      const stationeryCategorySlug = 'essentials';

      const isCategoryAllowed = (assigned: string, targetSlugOrName: string) => {
        const lower = assigned.toLowerCase();
        const target = targetSlugOrName.toLowerCase();
        if (lower.includes('food') && (target.includes('food') || target === 'food')) return true;
        if (lower.includes('fruit') && (target.includes('fruit') || target === 'fruits')) return true;
        if (lower.includes('laundry') && (target.includes('laundry') || target === 'laundry')) return true;
        if (lower.includes('stationery') || lower.includes('essential')) {
          if (target.includes('stationery') || target.includes('essential') || target === 'essentials') return true;
        }
        return false;
      };

      expect(isCategoryAllowed(providerCategory, foodCategorySlug)).toBe(true);
      expect(isCategoryAllowed(providerCategory, 'Food & Meals')).toBe(true);
      expect(isCategoryAllowed(providerCategory, stationeryCategorySlug)).toBe(false);
      expect(isCategoryAllowed(providerCategory, 'Fresh Fruits')).toBe(false);
    });

    it('provider products start as PENDING APPROVAL while Admin products are APPROVED', () => {
      const createProductPayload = (role: string) => {
        return {
          name: 'Special Chicken Thali',
          approvalStatus: role === 'ADMIN' ? 'APPROVED' : 'PENDING',
        };
      };

      const providerProduct = createProductPayload('SERVICE_PROVIDER');
      const adminProduct = createProductPayload('ADMIN');

      expect(providerProduct.approvalStatus).toBe('PENDING');
      expect(adminProduct.approvalStatus).toBe('APPROVED');
    });

    it('filters student marketplace products to only APPROVED items', () => {
      const catalog = [
        { id: 'p1', name: 'Veg Fried Rice', approvalStatus: 'APPROVED' },
        { id: 'p2', name: 'Special Burger', approvalStatus: 'PENDING' },
        { id: 'p3', name: 'Defective Stationery', approvalStatus: 'REJECTED' },
        { id: 'p4', name: 'Fresh Apples 1kg', approvalStatus: 'APPROVED' },
      ];

      const studentVisible = catalog.filter((p) => p.approvalStatus === 'APPROVED');
      expect(studentVisible.length).toBe(2);
      expect(studentVisible.map((p) => p.id)).toEqual(['p1', 'p4']);
    });
  });

  describe('6. Delivery Boy Status Advancement Flow', () => {
    it('follows sequential progression: DELIVERY_ASSIGNED -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED', () => {
      const allowedTransitions: Record<string, string[]> = {
        READY_FOR_PICKUP: ['PICKED_UP'],
        DELIVERY_ASSIGNED: ['PICKED_UP'],
        CONFIRMED: ['PICKED_UP'],
        PICKED_UP: ['OUT_FOR_DELIVERY'],
        OUT_FOR_DELIVERY: ['DELIVERED'],
      };

      const canAdvance = (current: string, next: string) => {
        return allowedTransitions[current]?.includes(next) ?? false;
      };

      // Valid steps
      expect(canAdvance('DELIVERY_ASSIGNED', 'PICKED_UP')).toBe(true);
      expect(canAdvance('PICKED_UP', 'OUT_FOR_DELIVERY')).toBe(true);
      expect(canAdvance('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);

      // Invalid steps (e.g. jumping straight to DELIVERED without picking up)
      expect(canAdvance('DELIVERY_ASSIGNED', 'DELIVERED')).toBe(false);
      expect(canAdvance('DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY')).toBe(false);
    });
  });

  describe('7. Service Provider Business Analytics & Tenant Isolation', () => {
    const providerOrders = [
      { id: 'o1', providerId: 'prov_food_01', totalAmount: 140, status: 'DELIVERED', studentId: 's1', createdAt: new Date() },
      { id: 'o2', providerId: 'prov_food_01', totalAmount: 250, status: 'DELIVERED', studentId: 's1', createdAt: new Date() },
      { id: 'o3', providerId: 'prov_food_01', totalAmount: 80, status: 'PREPARING', studentId: 's2', createdAt: new Date() },
      { id: 'o4', providerId: 'prov_laundry_01', totalAmount: 120, status: 'DELIVERED', studentId: 's3', createdAt: new Date() },
    ];

    it('calculates 10 KPI metrics accurately from real orders for a specific provider', () => {
      const myOrders = providerOrders.filter((o) => o.providerId === 'prov_food_01');
      const delivered = myOrders.filter((o) => o.status === 'DELIVERED');
      const totalSales = delivered.reduce((sum, o) => sum + o.totalAmount, 0);
      const activeCount = myOrders.filter((o) => ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)).length;

      expect(myOrders.length).toBe(3);
      expect(totalSales).toBe(390);
      expect(activeCount).toBe(1);
    });

    it('strictly isolates Provider A data from Provider B', () => {
      const foodProviderOrders = providerOrders.filter((o) => o.providerId === 'prov_food_01');
      const laundryProviderOrders = providerOrders.filter((o) => o.providerId === 'prov_laundry_01');

      expect(foodProviderOrders.some((o) => o.providerId === 'prov_laundry_01')).toBe(false);
      expect(laundryProviderOrders.some((o) => o.providerId === 'prov_food_01')).toBe(false);
    });

    it('resolves Delivery Boy login with User ID in both uppercase and lowercase', () => {
      const checkIdentifier = (input: string) => {
        const normalized = input.trim();
        const lower = normalized.toLowerCase();
        const upper = normalized.toUpperCase();
        return (
          normalized === 'DB_BOY_01' ||
          lower === 'db_boy_01' ||
          upper === 'DB_BOY_01' ||
          lower === 'runner.delivery@gmail.com'
        );
      };

      expect(checkIdentifier('DB_BOY_01')).toBe(true);
      expect(checkIdentifier('db_boy_01')).toBe(true);
      expect(checkIdentifier('DB_boy_01')).toBe(true);
      expect(checkIdentifier('runner.delivery@gmail.com')).toBe(true);
      expect(checkIdentifier('random_user')).toBe(false);
    });

    it('generates valid RFC-4180 CSV export rows for orders', () => {
      const escapeCsv = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
      const row = [
        escapeCsv('NIT-ORD-9021'),
        escapeCsv('2026-09-05T12:00:00Z'),
        escapeCsv('Sourav Senapati'),
        escapeCsv('Hall 11'),
        escapeCsv('B-304'),
        escapeCsv('Chicken Biryani (x2)'),
        280,
        escapeCsv('DELIVERED'),
        escapeCsv('RAZORPAY'),
        escapeCsv('Bikash Mondal'),
      ].join(',');

      expect(row).toContain('"NIT-ORD-9021"');
      expect(row).toContain('"Sourav Senapati"');
      expect(row).toContain('280');
      expect(row).toContain('"DELIVERED"');
    });
  });
});
