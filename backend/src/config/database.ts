import { PrismaClient } from '@prisma/client';
import { env } from './environment';
import {
  fallbackUsers,
  fallbackCategories,
  fallbackProducts,
  fallbackZones,
  fallbackHalls,
  fallbackOrders,
  fallbackLaundryJobs,
  fallbackOtpStore,
  fallbackSettings,
  fallbackSupportTickets,
  fallbackAuditLogs,
  fallbackAnnouncements,
  fallbackCoupons
} from '../services/fallbackData';

declare global {
  // eslint-disable-next-line no-var
  var rawPrismaInstance: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var isDatabaseHealthy: boolean;
}

export const rawPrisma: PrismaClient =
  global.rawPrismaInstance ||
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL
      }
    },
    log: env.NODE_ENV === 'development' ? ['error'] : ['error']
  });

if (env.NODE_ENV !== 'production') {
  global.rawPrismaInstance = rawPrisma;
}

import { autoSeedDatabase } from '../services/seedService';

global.isDatabaseHealthy = false;

export async function connectDatabase(): Promise<boolean> {
  try {
    await rawPrisma.$connect();
    global.isDatabaseHealthy = true;
    console.info('[Database] Connected successfully to MySQL database via Prisma');

    // Automatically check and seed empty database on boot
    autoSeedDatabase(rawPrisma).catch((err) => {
      console.warn('[Database] Auto-seed background error:', err);
    });

    return true;
  } catch (err: any) {
    global.isDatabaseHealthy = false;
    console.warn(
      `[Database] Notice: MySQL server not reachable on ${env.DATABASE_URL.split('@')[1] || 'localhost:3306'}. Operating in high-availability mock & fallback mode with verified admin (souravsenapati408@gmail.com), vendor, and student accounts.`
    );
    return false;
  }
}

// Fallback query engine when MySQL is not running locally
const fallbackHandlers: Record<string, any> = {
  user: {
    findUnique: async (args: any) => {
      const email = args?.where?.email?.toLowerCase()?.trim();
      const username = args?.where?.username?.toLowerCase()?.trim();
      const id = args?.where?.id;
      const found = fallbackUsers.find(
        (u: any) =>
          (id && u.id === id) ||
          (email && (u.email?.toLowerCase() === email || u.personalEmail?.toLowerCase() === email || u.collegeEmail?.toLowerCase() === email)) ||
          (username && u.username?.toLowerCase() === username)
      );
      if (!found) return null;
      return JSON.parse(JSON.stringify(found));
    },
    findFirst: async (args: any) => {
      const orList: any[] = args?.where?.OR;
      const roleFilter = args?.where?.role;
      if (Array.isArray(orList) && orList.length > 0) {
        for (const condition of orList) {
          const idVal = condition.id;
          const emailVal = (condition.email || '').toLowerCase().trim();
          const userVal = (condition.username || '').toLowerCase().trim();
          const colVal = (condition.collegeEmail || '').toLowerCase().trim();
          const perVal = (condition.personalEmail || '').toLowerCase().trim();
          const studCol = (condition.student?.collegeEmail || '').toLowerCase().trim();
          const studPer = (condition.student?.personalEmail || '').toLowerCase().trim();

          const found = fallbackUsers.find((u: any) => {
            if (roleFilter && u.role !== roleFilter) return false;
            const uId = u.id;
            const uEmail = (u.email || '').toLowerCase();
            const uUser = (u.username || '').toLowerCase();
            const uCol = (u.collegeEmail || '').toLowerCase();
            const uPer = (u.personalEmail || '').toLowerCase();
            const uStudCol = (u.student?.collegeEmail || '').toLowerCase();
            const uStudPer = (u.student?.personalEmail || '').toLowerCase();

            if (idVal && uId === idVal) return true;
            if (emailVal && (uEmail === emailVal || uPer === emailVal || uCol === emailVal || uUser === emailVal)) return true;
            if (userVal && (uUser === userVal || uEmail === userVal || uPer === userVal)) return true;
            if (colVal && (uCol === colVal || uEmail === colVal || uStudCol === colVal)) return true;
            if (perVal && (uPer === perVal || uStudPer === perVal || uEmail === perVal)) return true;
            if (studCol && (uStudCol === studCol || uCol === studCol)) return true;
            if (studPer && (uStudPer === studPer || uPer === studPer)) return true;
            return false;
          });

          if (found) return JSON.parse(JSON.stringify(found));
        }
      }

      const email = args?.where?.email?.toLowerCase()?.trim();
      const username = args?.where?.username?.toLowerCase()?.trim();
      const id = args?.where?.id;
      const found = fallbackUsers.find(
        (u: any) => {
          if (roleFilter && u.role !== roleFilter) return false;
          return (
            (id && u.id === id) ||
            (email && (u.email?.toLowerCase() === email || u.personalEmail?.toLowerCase() === email || u.collegeEmail?.toLowerCase() === email)) ||
            (username && u.username?.toLowerCase() === username)
          );
        }
      );
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },
    count: async (args: any) => {
      if (args?.where?.role) {
        return fallbackUsers.filter((u) => u.role === args.where.role).length;
      }
      return fallbackUsers.length;
    },
    findMany: async () => JSON.parse(JSON.stringify(fallbackUsers)),
    create: async (args: any) => {
      const newUser = {
        id: `usr_${Date.now()}`,
        email: args.data.email,
        collegeEmail: args.data.collegeEmail || (args.data.role === 'STUDENT' ? args.data.email : null),
        personalEmail: args.data.personalEmail || null,
        username: args.data.username || null,
        passwordHash: args.data.passwordHash,
        role: args.data.role || 'STUDENT',
        isActive: args.data.isActive !== undefined ? args.data.isActive : true,
        accountStatus: args.data.accountStatus || 'ACTIVE',
        collegeEmailVerified: args.data.collegeEmailVerified !== undefined ? args.data.collegeEmailVerified : true,
        personalEmailVerified: args.data.personalEmailVerified !== undefined ? args.data.personalEmailVerified : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      fallbackUsers.push(newUser as any);
      return JSON.parse(JSON.stringify(newUser));
    },
    update: async (args: any) => {
      const id = args?.where?.id;
      const email = args?.where?.email?.toLowerCase()?.trim();
      const user = fallbackUsers.find((u: any) => (id && u.id === id) || (email && u.email?.toLowerCase() === email));
      if (user && args.data) {
        Object.assign(user, args.data, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(user));
      }
      return args?.data || null;
    }
  },
  admin: {
    findUnique: async (args: any) => {
      const userId = args?.where?.userId;
      const id = args?.where?.id;
      const user = fallbackUsers.find((u) => u.admin && (u.admin.userId === userId || u.admin.id === id));
      return user?.admin ? JSON.parse(JSON.stringify(user.admin)) : null;
    }
  },
  student: {
    findUnique: async (args: any) => {
      const userId = args?.where?.userId;
      const rollNumber = args?.where?.rollNumber;
      const mobileNumber = args?.where?.mobileNumber;
      const registrationNumber = args?.where?.registrationNumber;
      const user = fallbackUsers.find((u) => u.student && (
        (userId && u.student.userId === userId) ||
        (rollNumber && u.student.rollNumber === rollNumber) ||
        (mobileNumber && u.student.mobileNumber === mobileNumber) ||
        (registrationNumber && u.student.registrationNumber === registrationNumber)
      ));
      return user?.student ? JSON.parse(JSON.stringify(user.student)) : null;
    },
    count: async () => fallbackUsers.filter((u) => u.role === 'STUDENT').length,
    findMany: async () => {
      return fallbackUsers
        .filter((u) => u.role === 'STUDENT' && u.student)
        .map((u) => ({
          ...u.student,
          user: { id: u.id, email: u.email, role: u.role, isActive: u.isActive },
          hall: fallbackHalls.find((h) => h.id === u.student?.hallId) || { id: 'hall_11', name: 'Hall 11', hallNumber: '11' },
          orders: fallbackOrders.filter((o) => o.studentId === u.student?.id),
          laundryOrders: fallbackLaundryJobs.filter((l) => l.studentId === u.student?.id)
        }));
    },
    create: async (args: any) => {
      const newStudent = {
        id: `std_${Date.now()}`,
        userId: args.data.userId,
        fullName: args.data.fullName,
        rollNumber: args.data.rollNumber,
        registrationNumber: args.data.registrationNumber,
        mobileNumber: args.data.mobileNumber,
        collegeEmail: args.data.collegeEmail || null,
        personalEmail: args.data.personalEmail || null,
        hallId: args.data.hallId,
        hallNumber: args.data.hallNumber,
        roomNumber: args.data.roomNumber,
        department: args.data.department || 'Engineering',
        programme: args.data.programme || 'B.Tech',
        year: args.data.year || '1st Year',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const user = fallbackUsers.find((u) => u.id === args.data.userId);
      if (user) {
        user.student = newStudent as any;
      }
      return JSON.parse(JSON.stringify(newStudent));
    }
  },
  serviceProvider: {
    findUnique: async (args: any) => {
      const userId = args?.where?.userId;
      const id = args?.where?.id;
      const user = fallbackUsers.find((u: any) => u.provider && (u.provider.userId === userId || u.provider.id === id));
      if (!user?.provider) return null;
      return JSON.parse(JSON.stringify({
        ...user.provider,
        user: { id: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive }
      }));
    },
    findFirst: async (args: any) => {
      const userId = args?.where?.userId;
      const id = args?.where?.id;
      const user = fallbackUsers.find((u: any) => u.provider && (u.provider.userId === userId || u.provider.id === id));
      if (!user?.provider) return null;
      return JSON.parse(JSON.stringify({
        ...user.provider,
        user: { id: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive }
      }));
    },
    findMany: async () =>
      fallbackUsers
        .filter((u: any) => u.provider)
        .map((u: any) => ({
          ...u.provider,
          user: { id: u.id, email: u.email, username: u.username, role: u.role, isActive: u.isActive }
        })),
    count: async () => fallbackUsers.filter((u: any) => u.provider).length
  },
  deliveryBoy: {
    findUnique: async (args: any) => {
      const userId = args?.where?.userId || args?.where?.OR?.find((o: any) => o.userId)?.userId;
      const id = args?.where?.id || args?.where?.OR?.find((o: any) => o.id)?.id;
      const user = fallbackUsers.find((u: any) => u.deliveryBoy && ((userId && (u.deliveryBoy.userId === userId || u.id === userId)) || (id && u.deliveryBoy.id === id)));
      if (!user?.deliveryBoy) return null;
      return JSON.parse(JSON.stringify({
        ...user.deliveryBoy,
        user: { id: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive }
      }));
    },
    findFirst: async (args: any) => {
      const userId = args?.where?.userId || args?.where?.OR?.find((o: any) => o.userId)?.userId;
      const id = args?.where?.id || args?.where?.OR?.find((o: any) => o.id)?.id;
      let user = fallbackUsers.find((u: any) => u.deliveryBoy && ((userId && (u.deliveryBoy.userId === userId || u.id === userId)) || (id && u.deliveryBoy.id === id)));
      if (!user && !userId && !id) {
        user = fallbackUsers.find((u: any) => u.deliveryBoy);
      }
      if (!user?.deliveryBoy) return null;
      return JSON.parse(JSON.stringify({
        ...user.deliveryBoy,
        user: { id: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive }
      }));
    },
    findMany: async () =>
      fallbackUsers
        .filter((u: any) => u.deliveryBoy)
        .map((u: any) => ({
          ...u.deliveryBoy,
          user: { id: u.id, email: u.email, username: u.username, role: u.role, isActive: u.isActive }
        })),
    count: async () => fallbackUsers.filter((u: any) => u.deliveryBoy).length,
    update: async (args: any) => {
      const id = args?.where?.id;
      const user = fallbackUsers.find((u: any) => u.deliveryBoy && u.deliveryBoy.id === id);
      if (user?.deliveryBoy) {
        Object.assign(user.deliveryBoy, args.data);
        return JSON.parse(JSON.stringify(user.deliveryBoy));
      }
      return args.data;
    }
  },
  category: {
    findMany: async () => {
      const cats = JSON.parse(JSON.stringify(fallbackCategories));
      return cats.map((c: any) => ({
        ...c,
        products: fallbackProducts.filter((p: any) => p.categoryId === c.id).map((p: any) => ({ id: p.id }))
      }));
    },
    findUnique: async (args: any) => {
      const slug = args?.where?.slug;
      const id = args?.where?.id;
      return fallbackCategories.find((c) => c.slug === slug || c.id === id) || null;
    },
    upsert: async (args: any) => args.create
  },
  product: {
    count: async (args: any) => {
      let prods = [...fallbackProducts];
      if (args?.where?.category?.slug) {
        const cat = fallbackCategories.find((c) => c.slug === args.where.category.slug);
        prods = prods.filter((p) => p.categoryId === cat?.id);
      }
      if (args?.where?.categoryId) {
        prods = prods.filter((p) => p.categoryId === args.where.categoryId);
      }
      if (args?.where?.availability !== undefined) {
        prods = prods.filter((p) => p.availability === args.where.availability);
      }
      if (args?.where?.isFeatured) {
        prods = prods.filter((p) => p.isFeatured);
      }
      if (args?.where?.stock?.lte !== undefined) {
        prods = prods.filter((p) => p.stock <= args.where.stock.lte);
      }
      if (args?.where?.stock?.gt !== undefined) {
        prods = prods.filter((p) => p.stock > args.where.stock.gt);
      }
      return prods.length;
    },
    findMany: async (args: any) => {
      let prods = [...fallbackProducts];
      if (args?.where?.category?.slug) {
        const cat = fallbackCategories.find((c) => c.slug === args.where.category.slug);
        prods = prods.filter((p) => p.categoryId === cat?.id);
      }
      if (args?.where?.categoryId) {
        prods = prods.filter((p) => p.categoryId === args.where.categoryId);
      }
      if (args?.where?.providerId) {
        prods = prods.filter((p: any) => p.providerId === args.where.providerId);
      }
      if (args?.where?.availability !== undefined) {
        prods = prods.filter((p) => p.availability === args.where.availability);
      }
      if (args?.where?.isFeatured) {
        prods = prods.filter((p) => p.isFeatured);
      }
      if (args?.where?.stock?.lte !== undefined) {
        prods = prods.filter((p) => p.stock <= args.where.stock.lte);
      }
      if (args?.where?.stock?.gt !== undefined) {
        prods = prods.filter((p) => p.stock > args.where.stock.gt);
      }
      const skip = args?.skip || 0;
      const take = args?.take || prods.length;
      const mapped = prods.slice(skip, skip + take).map((p) => {
        const cat = fallbackCategories.find((c) => c.id === p.categoryId);
        return {
          ...p,
          category: cat || null,
          images: p.images || [],
          reviews: (p as any).reviews || []
        };
      });
      return JSON.parse(JSON.stringify(mapped));
    },
    findUnique: async (args: any) => {
      const slug = args?.where?.slug;
      const id = args?.where?.id;
      const p = fallbackProducts.find((item) => item.slug === slug || item.id === id);
      if (!p) return null;
      const cat = fallbackCategories.find((c) => c.id === p.categoryId);
      return JSON.parse(JSON.stringify({
        ...p,
        category: cat || null,
        images: p.images || [],
        reviews: (p as any).reviews || []
      }));
    },
    upsert: async (args: any) => args.create
  },
  serviceZone: {
    findMany: async () => {
      const zones = JSON.parse(JSON.stringify(fallbackZones));
      return zones.map((z: any) => ({
        ...z,
        halls: fallbackHalls.filter((h: any) => (h as any).serviceZoneId === z.id)
      }));
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      return fallbackZones.find((z) => z.id === id) || null;
    }
  },
  hall: {
    findMany: async () => {
      const halls = JSON.parse(JSON.stringify(fallbackHalls));
      return halls.map((h: any) => ({
        ...h,
        students: fallbackUsers.filter((u: any) => u.student?.hallId === h.id).map((u: any) => u.student)
      }));
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      return fallbackHalls.find((h) => h.id === id) || null;
    }
  },
  order: {
    count: async (args: any) => {
      if (args?.where?.status) {
        return fallbackOrders.filter((o) => o.status === args.where.status).length;
      }
      return fallbackOrders.length;
    },
    findMany: async (args: any) => {
      let orders = [...fallbackOrders];
      if (args?.where?.providerId) {
        orders = orders.filter((o) => o.providerId === args.where.providerId);
      }
      if (args?.where?.studentId) {
        orders = orders.filter((o) => o.studentId === args.where.studentId);
      }
      if (args?.where?.deliveryBoyId === null) {
        orders = orders.filter((o) => !o.deliveryBoyId);
      } else if (args?.where?.deliveryBoyId) {
        orders = orders.filter((o) => o.deliveryBoyId === args.where.deliveryBoyId);
      }
      if (args?.where?.status) {
        if (args.where.status.in && Array.isArray(args.where.status.in)) {
          orders = orders.filter((o) => args.where.status.in.includes(o.status));
        } else if (typeof args.where.status === 'string') {
          orders = orders.filter((o) => o.status === args.where.status);
        }
      }
      return JSON.parse(JSON.stringify(orders));
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      return fallbackOrders.find((o) => o.id === id) || null;
    },
    create: async (args: any) => {
      const itemsData = args.data.items?.create || [];
      const newOrder = {
        id: `ord_${Date.now()}`,
        orderNumber: args.data.orderNumber || `NIT-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        studentId: args.data.studentId,
        providerId: args.data.providerId || null,
        deliveryBoyId: args.data.deliveryBoyId || null,
        status: args.data.status || 'CONFIRMED',
        totalAmount: args.data.totalAmount || 100,
        subtotal: args.data.subtotal || 100,
        deliveryFee: args.data.deliveryFee || 0,
        discountAmount: args.data.discountAmount || 0,
        paymentMethod: args.data.paymentMethod || 'CASH_ON_DELIVERY',
        paymentStatus: args.data.paymentStatus || 'PENDING',
        hallName: args.data.hallName || 'Hall 11',
        hallNumber: args.data.hallNumber || null,
        roomNumber: args.data.roomNumber || '123',
        specialInstructions: args.data.specialInstructions || null,
        items: itemsData.map((i: any, idx: number) => ({
          id: `item_${Date.now()}_${idx}`,
          productName: i.productName || 'Product Item',
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 50,
          totalPrice: i.totalPrice || 50
        })),
        statusHistory: [
          {
            id: `hist_${Date.now()}`,
            previousStatus: null,
            newStatus: args.data.status || 'CONFIRMED',
            changedBy: 'STUDENT',
            notes: 'Order initiated',
            createdAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      fallbackOrders.unshift(newOrder as any);
      return JSON.parse(JSON.stringify(newOrder));
    },
    update: async (args: any) => {
      const order = fallbackOrders.find((o) => o.id === args.where.id) as any;
      if (order) {
        Object.assign(order, args.data);
        if (args.data.statusHistory?.create) {
          if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
          order.statusHistory.push({
            id: `hist_${Date.now()}`,
            ...args.data.statusHistory.create,
            createdAt: new Date()
          });
        }
        order.updatedAt = new Date();
        return JSON.parse(JSON.stringify(order));
      }
      return args.data;
    }
  },
  laundryOrder: {
    count: async () => fallbackLaundryJobs.length,
    findMany: async () => JSON.parse(JSON.stringify(fallbackLaundryJobs)),
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      return fallbackLaundryJobs.find((j) => j.id === id) || null;
    },
    create: async (args: any) => ({
      id: `lnd_${Date.now()}`,
      orderNumber: `NIT-LND-${Math.floor(100 + Math.random() * 900)}`,
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    update: async (args: any) => {
      const job = fallbackLaundryJobs.find((j) => j.id === args.where.id) || fallbackLaundryJobs[0];
      return { ...job, ...args.data };
    }
  },
  payment: {
    count: async () => 0,
    create: async (args: any) => ({ id: `pay_${Date.now()}`, ...args.data })
  },
  cart: {
    findUnique: async (args: any) => ({
      id: `cart_${args?.where?.studentId}`,
      studentId: args?.where?.studentId,
      items: []
    }),
    create: async (args: any) => ({
      id: `cart_${args?.data?.studentId}`,
      studentId: args?.data?.studentId,
      items: []
    }),
    upsert: async (args: any) => ({
      id: `cart_${args?.where?.studentId}`,
      studentId: args?.where?.studentId,
      items: []
    })
  },
  otpVerification: {
    findFirst: async (args: any) => {
      const email = args?.where?.email?.toLowerCase();
      const purpose = args?.where?.purpose;
      return fallbackOtpStore.find((o) => o.email === email && (!purpose || o.purpose === purpose)) || null;
    },
    deleteMany: async (args: any) => {
      const email = args?.where?.email?.toLowerCase();
      const count = fallbackOtpStore.filter((o) => o.email === email).length;
      return { count };
    },
    create: async (args: any) => {
      fallbackOtpStore.push({
        id: `otp_${Date.now()}`,
        ...args.data,
        createdAt: new Date()
      });
      return args.data;
    },
    update: async (args: any) => args.data
  },
  adminSetting: {
    findMany: async () => JSON.parse(JSON.stringify(fallbackSettings)),
    findUnique: async (args: any) => {
      const key = args?.where?.key;
      return fallbackSettings.find((s) => s.key === key) || null;
    },
    upsert: async (args: any) => {
      const existing = fallbackSettings.find((s) => s.key === args.where.key);
      if (existing) {
        Object.assign(existing, args.update);
        return existing;
      }
      const created = { id: `set_${Date.now()}`, ...args.create };
      fallbackSettings.push(created);
      return created;
    }
  },
  supportTicket: {
    count: async (args: any) => {
      if (args?.where?.status) {
        return fallbackSupportTickets.filter((t) => t.status === args.where.status).length;
      }
      return fallbackSupportTickets.length;
    },
    findMany: async () => JSON.parse(JSON.stringify(fallbackSupportTickets)),
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      return fallbackSupportTickets.find((t) => t.id === id) || null;
    },
    update: async (args: any) => {
      const t = fallbackSupportTickets.find((item) => item.id === args.where.id);
      if (t) Object.assign(t, args.data);
      return t || args.data;
    }
  },
  auditLog: {
    findMany: async () => JSON.parse(JSON.stringify(fallbackAuditLogs)),
    create: async (args: any) => {
      const log = { id: `log_${Date.now()}`, ...args.data, createdAt: new Date() };
      fallbackAuditLogs.unshift(log);
      return log;
    }
  },
  announcement: {
    findMany: async () => JSON.parse(JSON.stringify(fallbackAnnouncements)),
    create: async (args: any) => {
      const ann = { id: `ann_${Date.now()}`, ...args.data, createdAt: new Date() };
      fallbackAnnouncements.unshift(ann);
      return ann;
    },
    update: async (args: any) => {
      const ann = fallbackAnnouncements.find((a) => a.id === args.where.id);
      if (ann) Object.assign(ann, args.data);
      return ann || args.data;
    },
    delete: async (args: any) => {
      const idx = fallbackAnnouncements.findIndex((a) => a.id === args.where.id);
      if (idx !== -1) fallbackAnnouncements.splice(idx, 1);
      return { success: true };
    }
  },
  coupon: {
    findMany: async () => JSON.parse(JSON.stringify(fallbackCoupons)),
    findUnique: async (args: any) => {
      const code = args?.where?.code;
      const id = args?.where?.id;
      return fallbackCoupons.find((c) => c.code === code || c.id === id) || null;
    },
    create: async (args: any) => {
      const cp = { id: `cp_${Date.now()}`, ...args.data, createdAt: new Date() };
      fallbackCoupons.push(cp);
      return cp;
    },
    update: async (args: any) => {
      const cp = fallbackCoupons.find((c) => c.id === args.where.id);
      if (cp) Object.assign(cp, args.data);
      return cp || args.data;
    },
    delete: async (args: any) => {
      const idx = fallbackCoupons.findIndex((c) => c.id === args.where.id);
      if (idx !== -1) fallbackCoupons.splice(idx, 1);
      return { success: true };
    }
  },
  inventory: {
    findUnique: async (args: any) => {
      const pId = args?.where?.productId;
      const prod = fallbackProducts.find((p) => p.id === pId);
      return prod ? { ...prod.inventory, productId: prod.id } : null;
    },
    update: async (args: any) => {
      const pId = args?.where?.productId;
      const prod = fallbackProducts.find((p) => p.id === pId);
      if (prod) {
        if (args.data.currentStock !== undefined) prod.stock = args.data.currentStock;
        if (args.data.lowStockThreshold !== undefined) prod.lowStockThreshold = args.data.lowStockThreshold;
        prod.inventory.currentStock = prod.stock;
        prod.inventory.lowStockThreshold = prod.lowStockThreshold;
      }
      return prod?.inventory || args.data;
    }
  },
  productImage: {
    findMany: async (args: any) => {
      const pId = args?.where?.productId;
      const prod = fallbackProducts.find((p) => p.id === pId);
      return prod?.images || [];
    },
    create: async (args: any) => {
      const pId = args?.data?.productId;
      const prod = fallbackProducts.find((p) => p.id === pId);
      const img = { id: `img_${Date.now()}`, ...args.data };
      if (prod) prod.images.push(img);
      return img;
    }
  },
  refund: {
    count: async () => 1,
    findMany: async () => [
      { id: 'ref_1', paymentId: 'pay_1', amount: 75, reason: 'Out of stock cancellation', status: 'REFUNDED', processedAt: new Date() }
    ],
    create: async (args: any) => ({ id: `ref_${Date.now()}`, ...args.data })
  }
};

// Create a Proxy that transparently falls back to mock handlers when database is offline or query fails
export const prisma = new Proxy(rawPrisma as any, {
  get(target, propKey, receiver) {
    if (propKey === '$connect') {
      return connectDatabase;
    }
    if (propKey === '$disconnect') {
      return async () => {};
    }
    if (propKey === '$transaction') {
      return async (cb: any) => {
        if (typeof cb === 'function') {
          return cb(receiver);
        }
        return Promise.all(cb);
      };
    }

    const modelName = String(propKey);
    const fallbackModel = fallbackHandlers[modelName];

    // If database is currently declared not healthy and we have a fallback handler, route directly
    if (!global.isDatabaseHealthy && fallbackModel) {
      return fallbackModel;
    }

    const originalProp = target[propKey];
    if (typeof originalProp === 'object' && originalProp !== null && fallbackModel) {
      return new Proxy(originalProp, {
        get(modelTarget, methodKey) {
          const originalMethod = modelTarget[methodKey];
          if (typeof originalMethod === 'function') {
            return async (...args: any[]) => {
              try {
                return await originalMethod.apply(modelTarget, args);
              } catch (err: any) {
                // If query fails due to connection error, use fallback
                if (
                  !global.isDatabaseHealthy ||
                  err?.name === 'PrismaClientInitializationError' ||
                  err?.message?.includes("Can't reach database") ||
                  err?.message?.includes('ECONNREFUSED')
                ) {
                  global.isDatabaseHealthy = false;
                  if (typeof fallbackModel[methodKey] === 'function') {
                    return await fallbackModel[methodKey](...args);
                  }
                }
                throw err;
              }
            };
          }
          return originalMethod;
        }
      });
    }

    return originalProp;
  }
}) as PrismaClient;
