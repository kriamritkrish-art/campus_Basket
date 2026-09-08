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
  fallbackCoupons,
  fallbackLaundryProviderConfigs,
  fallbackProviderSettlementAccounts,
  fallbackRefundAccounts,
  fallbackSettlements,
  fallbackSettlementItems,
  fallbackCodCollections,
  fallbackFinancialLedger,
  fallbackAdminStatusOverrides,
  fallbackCancellationRequests,
  fallbackFoodOrderDetails,
  fallbackLaundryOrderDetails,
  fallbackProduceOrderDetails,
  fallbackStationeryOrderDetails,
  fallbackLaundryServiceConfigs,
  fallbackLaundryCodCollections,
  fallbackLaundryOtps,
  fallbackDeliveryBoyEarnings,
  fallbackDeliveryBoyPayoutAccounts,
  fallbackDeliveryBoyWithdrawals,
  fallbackReturnRequests
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
          const googleSubVal = condition.googleSub;

          const found = fallbackUsers.find((u: any) => {
            if (roleFilter && u.role !== roleFilter) return false;
            const uId = u.id;
            const uEmail = (u.email || '').toLowerCase();
            const uUser = (u.username || '').toLowerCase();
            const uCol = (u.collegeEmail || '').toLowerCase();
            const uPer = (u.personalEmail || '').toLowerCase();
            const uStudCol = (u.student?.collegeEmail || '').toLowerCase();
            const uStudPer = (u.student?.personalEmail || '').toLowerCase();

            if (googleSubVal && u.googleSub === googleSubVal) return true;
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
      const id = args?.where?.id;
      const userId = args?.where?.userId;
      const rollNumber = args?.where?.rollNumber;
      const mobileNumber = args?.where?.mobileNumber;
      const registrationNumber = args?.where?.registrationNumber;
      const user = fallbackUsers.find((u) => u.student && (
        (id && u.student.id === id) ||
        (userId && u.student.userId === userId) ||
        (rollNumber && u.student.rollNumber === rollNumber) ||
        (mobileNumber && u.student.mobileNumber === mobileNumber) ||
        (registrationNumber && u.student.registrationNumber === registrationNumber)
      ));
      return user?.student ? JSON.parse(JSON.stringify(user.student)) : null;
    },
    findFirst: async (args: any) => {
      return fallbackHandlers.student.findUnique(args);
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
    count: async () => fallbackUsers.filter((u: any) => u.provider).length,
    update: async (args: any) => {
      const id = args?.where?.id;
      const user = fallbackUsers.find((u: any) => u.provider && u.provider.id === id);
      if (user?.provider) {
        Object.assign(user.provider, args.data);
        return JSON.parse(JSON.stringify(user.provider));
      }
      return args?.data || null;
    }
  },
  deliveryBoy: {
    findUnique: async (args: any) => {
      const userId = args?.where?.userId || args?.where?.OR?.find((o: any) => o.userId)?.userId;
      const id = args?.where?.id || args?.where?.OR?.find((o: any) => o.id)?.id;
      const user = fallbackUsers.find((u: any) => u.deliveryBoy && ((userId && (u.deliveryBoy.userId === userId || u.id === userId)) || (id && u.deliveryBoy.id === id)));
      if (!user?.deliveryBoy) return null;
      const dbEarnings = fallbackDeliveryBoyEarnings.filter((e) => e.deliveryBoyId === user.deliveryBoy.id);
      const payoutAccount = fallbackDeliveryBoyPayoutAccounts.find((p) => p.deliveryBoyId === user.deliveryBoy.id) || null;
      const withdrawals = fallbackDeliveryBoyWithdrawals.filter((w) => w.deliveryBoyId === user.deliveryBoy.id);
      return JSON.parse(JSON.stringify({
        ...user.deliveryBoy,
        totalSettled: Number(user.deliveryBoy.totalSettled) || 0.00,
        payoutAccount,
        withdrawals,
        earnings: dbEarnings,
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
      const dbEarnings = fallbackDeliveryBoyEarnings.filter((e) => e.deliveryBoyId === user.deliveryBoy.id);
      const payoutAccount = fallbackDeliveryBoyPayoutAccounts.find((p) => p.deliveryBoyId === user.deliveryBoy.id) || null;
      const withdrawals = fallbackDeliveryBoyWithdrawals.filter((w) => w.deliveryBoyId === user.deliveryBoy.id);
      return JSON.parse(JSON.stringify({
        ...user.deliveryBoy,
        totalSettled: Number(user.deliveryBoy.totalSettled) || 0.00,
        payoutAccount,
        withdrawals,
        earnings: dbEarnings,
        user: { id: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive }
      }));
    },
    findMany: async () =>
      fallbackUsers
        .filter((u: any) => u.deliveryBoy)
        .map((u: any) => {
          const dbEarnings = fallbackDeliveryBoyEarnings.filter((e) => e.deliveryBoyId === u.deliveryBoy.id);
          const orders = fallbackOrders.filter((o) => o.deliveryBoyId === u.deliveryBoy.id);
          const payoutAccount = fallbackDeliveryBoyPayoutAccounts.find((p) => p.deliveryBoyId === u.deliveryBoy.id) || null;
          const withdrawals = fallbackDeliveryBoyWithdrawals.filter((w) => w.deliveryBoyId === u.deliveryBoy.id);
          return {
            ...u.deliveryBoy,
            totalSettled: Number(u.deliveryBoy.totalSettled) || 0.00,
            payoutAccount,
            withdrawals,
            orders,
            laundryOrders: [],
            earnings: dbEarnings,
            user: { id: u.id, email: u.email, username: u.username, role: u.role, isActive: u.isActive }
          };
        }),
    count: async () => fallbackUsers.filter((u: any) => u.deliveryBoy).length,
    create: async (args: any) => {
      const newDb = {
        id: `db_boy_${Date.now()}`,
        userId: args.data.userId,
        fullName: args.data.fullName,
        mobileNumber: args.data.mobileNumber,
        vehicleType: args.data.vehicleType || 'Bicycle / Walk',
        activeStatus: args.data.activeStatus ?? true,
        currentZone: 'ALL',
        paymentType: args.data.paymentType || 'PER_DELIVERY',
        perDeliveryRate: args.data.perDeliveryRate !== undefined ? Number(args.data.perDeliveryRate) : 10.00,
        monthlySalary: args.data.monthlySalary !== undefined ? Number(args.data.monthlySalary) : 0.00,
        walletBalance: args.data.walletBalance !== undefined ? Number(args.data.walletBalance) : 0.00,
        totalSettled: 0.00,
        plainPassword: args.data.plainPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const user = fallbackUsers.find((u) => u.id === args.data.userId);
      if (user) (user as any).deliveryBoy = newDb;
      return JSON.parse(JSON.stringify(newDb));
    },
    update: async (args: any) => {
      const id = args?.where?.id;
      const user = fallbackUsers.find((u: any) => u.deliveryBoy && u.deliveryBoy.id === id);
      if (user?.deliveryBoy) {
        const updateData = { ...args.data };
        if (updateData.walletBalance && typeof updateData.walletBalance === 'object') {
          if (updateData.walletBalance.increment !== undefined) {
            updateData.walletBalance = (Number(user.deliveryBoy.walletBalance) || 0) + Number(updateData.walletBalance.increment);
          } else if (updateData.walletBalance.decrement !== undefined) {
            updateData.walletBalance = (Number(user.deliveryBoy.walletBalance) || 0) - Number(updateData.walletBalance.decrement);
          }
        }
        if (updateData.totalSettled && typeof updateData.totalSettled === 'object') {
          if (updateData.totalSettled.increment !== undefined) {
            updateData.totalSettled = (Number(user.deliveryBoy.totalSettled) || 0) + Number(updateData.totalSettled.increment);
          }
        }
        Object.assign(user.deliveryBoy, updateData);
        return JSON.parse(JSON.stringify(user.deliveryBoy));
      }
      return args.data;
    },
    delete: async (args: any) => {
      const id = args?.where?.id;
      const user = fallbackUsers.find((u: any) => u.deliveryBoy && u.deliveryBoy.id === id);
      if (user) {
        (user as any).deliveryBoy = null;
      }
      return { id };
    }
  },
  deliveryBoyPayoutAccount: {
    findUnique: async (args: any) => {
      const deliveryBoyId = args?.where?.deliveryBoyId;
      const id = args?.where?.id;
      const found = fallbackDeliveryBoyPayoutAccounts.find((a) => (deliveryBoyId && a.deliveryBoyId === deliveryBoyId) || (id && a.id === id));
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },
    findFirst: async (args: any) => {
      const deliveryBoyId = args?.where?.deliveryBoyId;
      const found = fallbackDeliveryBoyPayoutAccounts.find((a) => a.deliveryBoyId === deliveryBoyId);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },
    upsert: async (args: any) => {
      const deliveryBoyId = args?.where?.deliveryBoyId;
      const idx = fallbackDeliveryBoyPayoutAccounts.findIndex((a) => a.deliveryBoyId === deliveryBoyId);
      if (idx >= 0) {
        Object.assign(fallbackDeliveryBoyPayoutAccounts[idx], args.update, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(fallbackDeliveryBoyPayoutAccounts[idx]));
      }
      const newAcc = {
        id: `payout_acc_${Date.now()}`,
        deliveryBoyId,
        accountType: args.create.accountType || 'UPI',
        accountHolderName: args.create.accountHolderName,
        bankName: args.create.bankName || null,
        accountNumber: args.create.accountNumber || null,
        ifscCode: args.create.ifscCode || null,
        upiId: args.create.upiId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      fallbackDeliveryBoyPayoutAccounts.push(newAcc);
      return JSON.parse(JSON.stringify(newAcc));
    },
    update: async (args: any) => {
      const deliveryBoyId = args?.where?.deliveryBoyId;
      const idx = fallbackDeliveryBoyPayoutAccounts.findIndex((a) => a.deliveryBoyId === deliveryBoyId);
      if (idx >= 0) {
        Object.assign(fallbackDeliveryBoyPayoutAccounts[idx], args.data, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(fallbackDeliveryBoyPayoutAccounts[idx]));
      }
      return args.data;
    }
  },
  deliveryBoyWithdrawal: {
    findMany: async (args: any) => {
      let list = [...fallbackDeliveryBoyWithdrawals];
      if (args?.where?.deliveryBoyId) {
        list = list.filter((w) => w.deliveryBoyId === args.where.deliveryBoyId);
      }
      if (args?.where?.status) {
        list = list.filter((w) => w.status === args.where.status);
      }
      // Populate deliveryBoy if requested
      return JSON.parse(JSON.stringify(list.map((w) => {
        const u = fallbackUsers.find((user: any) => user.deliveryBoy && user.deliveryBoy.id === w.deliveryBoyId);
        return {
          ...w,
          deliveryBoy: u?.deliveryBoy ? {
            id: u.deliveryBoy.id,
            fullName: u.deliveryBoy.fullName,
            mobileNumber: u.deliveryBoy.mobileNumber,
            walletBalance: Number(u.deliveryBoy.walletBalance) || 0,
            totalSettled: Number(u.deliveryBoy.totalSettled) || 0,
            paymentType: u.deliveryBoy.paymentType
          } : null
        };
      })));
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const withdrawalNumber = args?.where?.withdrawalNumber;
      const found = fallbackDeliveryBoyWithdrawals.find((w) => (id && w.id === id) || (withdrawalNumber && w.withdrawalNumber === withdrawalNumber));
      if (!found) return null;
      const u = fallbackUsers.find((user: any) => user.deliveryBoy && user.deliveryBoy.id === found.deliveryBoyId);
      return JSON.parse(JSON.stringify({
        ...found,
        deliveryBoy: u?.deliveryBoy ? {
          id: u.deliveryBoy.id,
          fullName: u.deliveryBoy.fullName,
          mobileNumber: u.deliveryBoy.mobileNumber,
          walletBalance: Number(u.deliveryBoy.walletBalance) || 0,
          totalSettled: Number(u.deliveryBoy.totalSettled) || 0,
          paymentType: u.deliveryBoy.paymentType
        } : null
      }));
    },
    create: async (args: any) => {
      const newWithdrawal = {
        id: `wdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        withdrawalNumber: args.data.withdrawalNumber || `WDR-${Date.now().toString().slice(-6)}`,
        deliveryBoyId: args.data.deliveryBoyId,
        amount: Number(args.data.amount),
        status: args.data.status || 'PENDING',
        payoutMethod: args.data.payoutMethod || 'UPI',
        accountDetails: args.data.accountDetails || null,
        adminNotes: args.data.adminNotes || null,
        processedBy: args.data.processedBy || null,
        utrReference: args.data.utrReference || null,
        requestedAt: new Date(),
        approvedAt: null,
        distributedAt: null,
        rejectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      fallbackDeliveryBoyWithdrawals.unshift(newWithdrawal);
      return JSON.parse(JSON.stringify(newWithdrawal));
    },
    update: async (args: any) => {
      const id = args?.where?.id;
      const idx = fallbackDeliveryBoyWithdrawals.findIndex((w) => w.id === id);
      if (idx >= 0) {
        Object.assign(fallbackDeliveryBoyWithdrawals[idx], args.data, { updatedAt: new Date() });
        const updated = fallbackDeliveryBoyWithdrawals[idx];
        const u = fallbackUsers.find((user: any) => user.deliveryBoy && user.deliveryBoy.id === updated.deliveryBoyId);
        return JSON.parse(JSON.stringify({
          ...updated,
          deliveryBoy: u?.deliveryBoy || null
        }));
      }
      return args.data;
    }
  },
  deliveryBoyEarning: {
    findMany: async (args: any) => {
      let list = [...fallbackDeliveryBoyEarnings];
      if (args?.where?.deliveryBoyId) {
        list = list.filter((e) => e.deliveryBoyId === args.where.deliveryBoyId);
      }
      if (args?.where?.orderId) {
        list = list.filter((e) => e.orderId === args.where.orderId);
      }
      return JSON.parse(JSON.stringify(list));
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const orderId = args?.where?.orderId;
      const found = fallbackDeliveryBoyEarnings.find((e) => (id && e.id === id) || (orderId && e.orderId === orderId));
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },
    create: async (args: any) => {
      const newRecord = {
        id: `earn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date(),
        ...args.data
      };
      fallbackDeliveryBoyEarnings.unshift(newRecord);
      return JSON.parse(JSON.stringify(newRecord));
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
    findFirst: async (args: any) => {
      const prods = await fallbackHandlers.product.findMany(args);
      return prods[0] || null;
    },
    upsert: async (args: any) => args.create,
    create: async (args: any) => {
      const prodData = args?.data || {};
      const newId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const priceNum = Number(prodData.price) || 0;
      const discountNum = prodData.discountPrice ? Number(prodData.discountPrice) : null;
      const discPct =
        prodData.discountPercentage !== undefined
          ? Number(prodData.discountPercentage)
          : discountNum && priceNum > 0 && discountNum < priceNum
          ? Math.max(0, Math.round(((priceNum - discountNum) / priceNum) * 100))
          : 0;

      const newProduct: any = {
        id: newId,
        name: prodData.name,
        slug: prodData.slug || prodData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        categoryId: prodData.categoryId,
        subcategory: prodData.subcategory || null,
        dietaryType: prodData.dietaryType || 'Not Applicable',
        tags: prodData.tags || null,
        image: prodData.image || null,
        deliveryType: prodData.deliveryTime || prodData.deliveryType || '10-15 mins',
        description: prodData.description || '',
        price: priceNum,
        discountPrice: discountNum,
        discountPercentage: discPct,
        unit: prodData.unit || 'piece',
        sku: prodData.sku || `SKU-${Date.now().toString().slice(-6)}`,
        stock: parseInt(prodData.stock, 10) || 0,
        lowStockThreshold: parseInt(prodData.lowStockThreshold, 10) || 5,
        availability: prodData.availability !== undefined ? Boolean(prodData.availability) : true,
        isFeatured: Boolean(prodData.isFeatured),
        isPopular: Boolean(prodData.isPopular),
        availableToday: prodData.availableToday !== undefined ? Boolean(prodData.availableToday) : true,
        providerId: prodData.providerId || null,
        approvalStatus: prodData.approvalStatus || 'APPROVED',
        approvedBy: prodData.approvedBy || 'ADMIN',
        approvedAt: new Date(),
        images: prodData.image ? [{ id: `img_${newId}`, googleDriveUrl: prodData.image, isPrimary: true }] : [],
        inventory: {
          id: `inv_${Date.now()}`,
          productId: newId,
          currentStock: parseInt(prodData.stock, 10) || 0,
          lowStockThreshold: parseInt(prodData.lowStockThreshold, 10) || 5,
          isOutOfStock: (parseInt(prodData.stock, 10) || 0) <= 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      fallbackProducts.unshift(newProduct);
      return JSON.parse(JSON.stringify(newProduct));
    },
    update: async (args: any) => {
      const id = args?.where?.id;
      const prod = fallbackProducts.find((p: any) => p.id === id);
      if (prod && args.data) {
        const updateData = { ...args.data };
        if (updateData.price !== undefined || updateData.discountPrice !== undefined) {
          const p = updateData.price !== undefined ? Number(updateData.price) : Number(prod.price);
          const d = updateData.discountPrice !== undefined ? (updateData.discountPrice ? Number(updateData.discountPrice) : null) : (prod.discountPrice ? Number(prod.discountPrice) : null);
          if (p > 0 && d && d < p) {
            updateData.discountPercentage = Math.round(((p - d) / p) * 100);
          } else {
            updateData.discountPercentage = 0;
          }
        }
        Object.assign(prod, updateData, { updatedAt: new Date() });
        if (args.data.stock !== undefined && prod.inventory) {
          prod.inventory.currentStock = parseInt(args.data.stock, 10);
          (prod.inventory as any).isOutOfStock = prod.inventory.currentStock <= 0;
        }
        return JSON.parse(JSON.stringify(prod));
      }
      return args?.data || null;
    },
    delete: async (args: any) => {
      const id = args?.where?.id;
      const idx = fallbackProducts.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        const deleted = fallbackProducts.splice(idx, 1)[0];
        return JSON.parse(JSON.stringify(deleted));
      }
      return { id };
    }
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
      if (args?.where?.serviceType) {
        orders = orders.filter((o: any) => (o.serviceType || 'FOOD') === args.where.serviceType);
      }
      if (args?.where?.paymentStatus) {
        orders = orders.filter((o: any) => o.paymentStatus === args.where.paymentStatus);
      }
      if (args?.where?.refundStatus) {
        orders = orders.filter((o: any) => (o.refundStatus || 'NOT_APPLICABLE') === args.where.refundStatus);
      }
      if (args?.where?.settlementStatus) {
        orders = orders.filter((o: any) => (o.settlementStatus || 'PENDING') === args.where.settlementStatus);
      }
      if (args?.where?.status) {
        if (args.where.status.in && Array.isArray(args.where.status.in)) {
          orders = orders.filter((o) => args.where.status.in.includes(o.status));
        } else if (typeof args.where.status === 'string') {
          orders = orders.filter((o) => o.status === args.where.status);
        }
      }
      const mapped = orders.map((o: any) => {
        const studentUser = fallbackUsers.find((u: any) => u.student?.id === o.studentId);
        const provUser = fallbackUsers.find((u: any) => u.provider?.id === o.providerId);
        const dbUser = fallbackUsers.find((u: any) => u.deliveryBoy?.id === o.deliveryBoyId);
        const total = o.totalAmount || 0;
        const commRate = o.commissionRate !== undefined ? o.commissionRate : 5.0;
        const commAmt = o.commissionAmount !== undefined ? o.commissionAmount : Math.round(total * (commRate / 100) * 100) / 100;
        const payable = o.providerPayable !== undefined ? o.providerPayable : Math.round((total - commAmt) * 100) / 100;

        return {
          ...o,
          serviceType: o.serviceType || 'FOOD',
          providerAccepted: Boolean(o.providerAccepted),
          advancePaidAmount: Number(o.advancePaidAmount || 0),
          refundAmount: Number(o.refundAmount || 0),
          refundStatus: o.refundStatus || 'NOT_APPLICABLE',
          settlementStatus: o.settlementStatus || (o.status === 'DELIVERED' ? 'ELIGIBLE' : 'PENDING'),
          commissionRate: commRate,
          commissionAmount: commAmt,
          providerPayable: payable,
          student: studentUser?.student ? { fullName: studentUser.student.fullName, mobileNumber: studentUser.student.mobileNumber, roomNumber: studentUser.student.roomNumber } : (o.student || { fullName: 'Student', mobileNumber: '', roomNumber: o.roomNumber }),
          provider: provUser?.provider ? { fullName: provUser.provider.fullName, mobileNumber: provUser.provider.mobileNumber, serviceCategory: provUser.provider.serviceCategory } : (o.provider || null),
          deliveryBoy: dbUser?.deliveryBoy ? { id: dbUser.deliveryBoy.id, fullName: dbUser.deliveryBoy.fullName, mobileNumber: dbUser.deliveryBoy.mobileNumber, vehicleType: dbUser.deliveryBoy.vehicleType } : (o.deliveryBoy || null),
          items: o.items || [],
          foodOrderDetails: fallbackFoodOrderDetails.find(f => f.orderId === o.id) || null,
          laundryOrderDetails: fallbackLaundryOrderDetails.find(l => l.orderId === o.id) || null,
          produceOrderDetails: fallbackProduceOrderDetails.find(p => p.orderId === o.id) || null,
          stationeryOrderDetails: fallbackStationeryOrderDetails.find(s => s.orderId === o.id) || null,
          codCollection: fallbackCodCollections.find(c => c.orderId === o.id) || null,
          cancellationRequests: fallbackCancellationRequests.filter(c => c.orderId === o.id) || [],
          adminStatusOverrides: fallbackAdminStatusOverrides.filter(a => a.orderId === o.id) || [],
          refunds: (global as any).__mockRefunds?.filter((r: any) => r.orderId === o.id) || (o.refunds || []),
          returnRequest: fallbackReturnRequests.find(r => r.orderId === o.id) || null
        };
      });
      return JSON.parse(JSON.stringify(mapped));
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const orderNumber = args?.where?.orderNumber;
      const o = fallbackOrders.find((item) => (id && item.id === id) || (orderNumber && item.orderNumber === orderNumber)) as any;
      if (!o) return null;
      const studentUser = fallbackUsers.find((u: any) => u.student?.id === o.studentId);
      const provUser = fallbackUsers.find((u: any) => u.provider?.id === o.providerId);
      const dbUser = fallbackUsers.find((u: any) => u.deliveryBoy?.id === o.deliveryBoyId);
      const total = o.totalAmount || 0;
      const commRate = o.commissionRate !== undefined ? o.commissionRate : 5.0;
      const commAmt = o.commissionAmount !== undefined ? o.commissionAmount : Math.round(total * (commRate / 100) * 100) / 100;
      const payable = o.providerPayable !== undefined ? o.providerPayable : Math.round((total - commAmt) * 100) / 100;

      return JSON.parse(JSON.stringify({
        ...o,
        serviceType: o.serviceType || 'FOOD',
        refundStatus: o.refundStatus || 'NOT_APPLICABLE',
        settlementStatus: o.settlementStatus || (o.status === 'DELIVERED' ? 'ELIGIBLE' : 'PENDING'),
        commissionRate: commRate,
        commissionAmount: commAmt,
        providerPayable: payable,
        student: studentUser?.student ? { fullName: studentUser.student.fullName, mobileNumber: studentUser.student.mobileNumber, roomNumber: studentUser.student.roomNumber } : (o.student || { fullName: 'Student', mobileNumber: '', roomNumber: o.roomNumber }),
        provider: provUser?.provider ? { fullName: provUser.provider.fullName, mobileNumber: provUser.provider.mobileNumber, serviceCategory: provUser.provider.serviceCategory } : (o.provider || null),
        deliveryBoy: dbUser?.deliveryBoy ? { id: dbUser.deliveryBoy.id, fullName: dbUser.deliveryBoy.fullName, mobileNumber: dbUser.deliveryBoy.mobileNumber, vehicleType: dbUser.deliveryBoy.vehicleType } : (o.deliveryBoy || null),
        items: o.items || [],
        foodOrderDetails: fallbackFoodOrderDetails.find(f => f.orderId === o.id) || null,
        laundryOrderDetails: fallbackLaundryOrderDetails.find(l => l.orderId === o.id) || null,
        produceOrderDetails: fallbackProduceOrderDetails.find(p => p.orderId === o.id) || null,
        stationeryOrderDetails: fallbackStationeryOrderDetails.find(s => s.orderId === o.id) || null,
        codCollection: fallbackCodCollections.find(c => c.orderId === o.id) || null,
        cancellationRequests: fallbackCancellationRequests.filter(c => c.orderId === o.id) || [],
        adminStatusOverrides: fallbackAdminStatusOverrides.filter(a => a.orderId === o.id) || [],
        refunds: (global as any).__mockRefunds?.filter((r: any) => r.orderId === o.id) || (o.refunds || []),
        returnRequest: fallbackReturnRequests.find(r => r.orderId === o.id) || null
      }));
    },
    create: async (args: any) => {
      const itemsData = args.data.items?.create || [];
      const orderId = `ord_${Date.now()}`;
      const totalAmount = args.data.totalAmount || 100;
      const commRate = args.data.commissionRate !== undefined ? args.data.commissionRate : 5.0;
      const commAmt = args.data.commissionAmount !== undefined ? args.data.commissionAmount : Math.round(totalAmount * (commRate / 100) * 100) / 100;
      const payable = args.data.providerPayable !== undefined ? args.data.providerPayable : Math.round((totalAmount - commAmt) * 100) / 100;

      const newOrder = {
        id: orderId,
        orderNumber: args.data.orderNumber || `CB-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        studentId: args.data.studentId,
        providerId: args.data.providerId || null,
        deliveryBoyId: args.data.deliveryBoyId || null,
        serviceType: args.data.serviceType || 'FOOD',
        status: args.data.status || 'CONFIRMED',
        totalAmount,
        subtotal: args.data.subtotal || totalAmount,
        deliveryFee: args.data.deliveryFee || 0,
        discountAmount: args.data.discountAmount || 0,
        paymentMethod: args.data.paymentMethod || 'CASH_ON_DELIVERY',
        paymentStatus: args.data.paymentStatus || (args.data.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD_PENDING' : 'PENDING'),
        refundStatus: args.data.refundStatus || 'NOT_APPLICABLE',
        settlementStatus: args.data.settlementStatus || 'PENDING',
        commissionRate: commRate,
        commissionAmount: commAmt,
        providerPayable: payable,
        hallName: args.data.hallName || 'Hall 11',
        hallNumber: args.data.hallNumber || null,
        roomNumber: args.data.roomNumber || '123',
        specialInstructions: args.data.specialInstructions || null,
        deliveryOtp: args.data.deliveryOtp || '123456',
        deliveryOtpVerified: args.data.deliveryOtpVerified || false,
        deliveredAt: args.data.deliveredAt || null,
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

      if (args.data.foodOrderDetails?.create) {
        fallbackFoodOrderDetails.push({ id: `fod_${Date.now()}`, orderId, ...args.data.foodOrderDetails.create, createdAt: new Date(), updatedAt: new Date() });
      }
      if (args.data.laundryOrderDetails?.create) {
        fallbackLaundryOrderDetails.push({ id: `lod_${Date.now()}`, orderId, ...args.data.laundryOrderDetails.create, createdAt: new Date(), updatedAt: new Date() });
      }
      if (args.data.produceOrderDetails?.create) {
        fallbackProduceOrderDetails.push({ id: `pod_${Date.now()}`, orderId, ...args.data.produceOrderDetails.create, createdAt: new Date(), updatedAt: new Date() });
      }
      if (args.data.stationeryOrderDetails?.create) {
        fallbackStationeryOrderDetails.push({ id: `sod_${Date.now()}`, orderId, ...args.data.stationeryOrderDetails.create, createdAt: new Date(), updatedAt: new Date() });
      }

      fallbackOrders.unshift(newOrder as any);
      return JSON.parse(JSON.stringify(newOrder));
    },
    update: async (args: any) => {
      const order = fallbackOrders.find((o) => o.id === args.where.id || o.orderNumber === args.where.orderNumber) as any;
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
  orderItem: {
    create: async (args: any) => {
      const newItem = {
        id: `oi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...args.data
      };
      const order = fallbackOrders.find((o) => o.id === args.data?.orderId);
      if (order) {
        if (!Array.isArray(order.items)) order.items = [];
        order.items.push(newItem);
      }
      return JSON.parse(JSON.stringify(newItem));
    },
    update: async (args: any) => args.data,
    findMany: async () => []
  },
  laundryServiceConfig: {
    findMany: async (args?: any) => {
      let list = [...fallbackLaundryServiceConfigs];
      if (args?.where?.providerId) list = list.filter(c => c.providerId === args.where.providerId);
      if (args?.where?.serviceName) list = list.filter(c => c.serviceName.toLowerCase() === args.where.serviceName.toLowerCase());
      if (args?.where?.isAvailable !== undefined) list = list.filter(c => c.isAvailable === args.where.isAvailable);
      return JSON.parse(JSON.stringify(list));
    },
    findFirst: async (args?: any) => {
      let list = [...fallbackLaundryServiceConfigs];
      if (args?.where?.providerId) list = list.filter(c => c.providerId === args.where.providerId);
      if (args?.where?.serviceName) list = list.filter(c => c.serviceName.toLowerCase() === args.where.serviceName.toLowerCase());
      return list[0] ? JSON.parse(JSON.stringify(list[0])) : null;
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const found = fallbackLaundryServiceConfigs.find(c => c.id === id);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },
    create: async (args: any) => {
      const created = {
        id: `lsc_${Date.now()}`,
        unitDisplayName: args.data.unitDisplayName || 'per dress',
        minQuantity: args.data.minQuantity || 1,
        turnaroundHours: args.data.turnaroundHours || 48,
        isAvailable: args.data.isAvailable !== undefined ? args.data.isAvailable : true,
        tariffHeroTitle: args.data.tariffHeroTitle || 'Express Campus Laundry',
        tariffHeroSubtitle: args.data.tariffHeroSubtitle || 'Automated wash, fabric softening & steam iron with room-to-room pickup across Halls 1–14',
        tariffTag: args.data.tariffTag || 'DUAL-OTP',
        tariffBadge: args.data.tariffBadge || 'SUBSIDIZED TARIFF',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      fallbackLaundryServiceConfigs.push(created as any);
      return JSON.parse(JSON.stringify(created));
    },
    update: async (args: any) => {
      const found = fallbackLaundryServiceConfigs.find(c => c.id === args.where.id);
      if (found) {
        Object.assign(found, args.data, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(found));
      }
      return args.data;
    },
    delete: async (args: any) => {
      const idx = fallbackLaundryServiceConfigs.findIndex(c => c.id === args.where.id);
      if (idx !== -1) fallbackLaundryServiceConfigs.splice(idx, 1);
      return { success: true };
    }
  },
  laundryCodCollection: {
    findMany: async (args?: any) => {
      let list = [...fallbackLaundryCodCollections];
      if (args?.where?.providerId) list = list.filter(c => c.providerId === args.where.providerId);
      if (args?.where?.collectionStatus) list = list.filter(c => c.collectionStatus === args.where.collectionStatus);
      return JSON.parse(JSON.stringify(list));
    },
    findUnique: async (args: any) => {
      const found = fallbackLaundryCodCollections.find(c => c.id === args.where.id || c.laundryOrderId === args.where.laundryOrderId || c.collectionNumber === args.where.collectionNumber);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },
    findFirst: async (args: any) => {
      const found = fallbackLaundryCodCollections.find(c => c.laundryOrderId === args.where?.laundryOrderId);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },
    create: async (args: any) => {
      const col = {
        id: `lcod_${Date.now()}`,
        collectionNumber: args.data.collectionNumber || `CB-LCOD-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data
      };
      fallbackLaundryCodCollections.unshift(col as any);
      return JSON.parse(JSON.stringify(col));
    },
    update: async (args: any) => {
      const found = fallbackLaundryCodCollections.find(c => c.id === args.where.id || c.laundryOrderId === args.where.laundryOrderId);
      if (found) {
        Object.assign(found, args.data, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(found));
      }
      return args.data;
    },
    count: async () => fallbackLaundryCodCollections.length
  },
  laundryOtp: {
    findMany: async (args?: any) => {
      let otps = [...fallbackLaundryOtps];
      if (args?.where?.laundryOrderId) otps = otps.filter(o => o.laundryOrderId === args.where.laundryOrderId);
      if (args?.where?.otpType) otps = otps.filter(o => o.otpType === args.where.otpType);
      return JSON.parse(JSON.stringify(otps));
    },
    findFirst: async (args?: any) => {
      let otps = [...fallbackLaundryOtps];
      if (args?.where?.laundryOrderId) otps = otps.filter(o => o.laundryOrderId === args.where.laundryOrderId);
      if (args?.where?.otpType) otps = otps.filter(o => o.otpType === args.where.otpType);
      return otps[0] ? JSON.parse(JSON.stringify(otps[0])) : null;
    },
    create: async (args: any) => {
      const newOtp = {
        id: `lotp_${Date.now()}`,
        laundryOrderId: args.data.laundryOrderId,
        otpType: args.data.otpType,
        otpHash: args.data.otpHash,
        encryptedOtp: args.data.encryptedOtp || null,
        isUsed: false,
        attempts: 0,
        expiresAt: args.data.expiresAt,
        verifiedAt: null,
        verifiedBy: null,
        createdAt: new Date()
      };
      fallbackLaundryOtps.unshift(newOtp as any);
      return JSON.parse(JSON.stringify(newOtp));
    },
    update: async (args: any) => {
      const found = fallbackLaundryOtps.find(o => o.id === args.where.id);
      if (found) {
        Object.assign(found, args.data);
        return JSON.parse(JSON.stringify(found));
      }
      return args.data;
    },
    deleteMany: async (args: any) => {
      const before = fallbackLaundryOtps.length;
      const filtered = fallbackLaundryOtps.filter((o: any) => {
        if (args?.where?.laundryOrderId && o.laundryOrderId !== args.where.laundryOrderId) return true;
        if (args?.where?.otpType && o.otpType !== args.where.otpType) return true;
        return false;
      });
      fallbackLaundryOtps.length = 0;
      fallbackLaundryOtps.push(...filtered);
      return { count: before - fallbackLaundryOtps.length };
    }
  },
  laundryOrder: {
    count: async () => fallbackLaundryJobs.length,
    findMany: async (args?: any) => {
      let jobs = [...fallbackLaundryJobs];
      if (args?.where?.studentId) jobs = jobs.filter(j => j.studentId === args.where.studentId);
      if (args?.where?.providerId) jobs = jobs.filter(j => j.providerId === args.where.providerId);
      if (args?.where?.status) {
        if (args.where.status.in && Array.isArray(args.where.status.in)) {
          jobs = jobs.filter(j => args.where.status.in.includes(j.status));
        } else if (typeof args.where.status === 'string') {
          jobs = jobs.filter(j => j.status === args.where.status);
        }
      }
      if (args?.where?.paymentStatus) jobs = jobs.filter(j => j.paymentStatus === args.where.paymentStatus);
      if (args?.where?.settlementStatus) jobs = jobs.filter(j => j.settlementStatus === args.where.settlementStatus);
      return JSON.parse(JSON.stringify(jobs.map(j => ({
        ...j,
        laundryBaseAmount: j.laundryBaseAmount !== undefined ? j.laundryBaseAmount : (j.finalPrice || j.estimatedPrice || 0) * 0.95,
        serviceChargeAmount: j.serviceChargeAmount !== undefined ? j.serviceChargeAmount : (j.finalPrice || j.estimatedPrice || 0) * 0.05,
        totalAmount: j.totalAmount || j.finalPrice || j.estimatedPrice || 0,
        onlinePaidAmount: j.onlinePaidAmount !== undefined ? j.onlinePaidAmount : (j.paymentMethod === 'ONLINE' ? j.totalAmount : j.serviceChargeAmount),
        codAmount: j.codAmount !== undefined ? j.codAmount : (j.paymentMethod === 'COD' ? j.laundryBaseAmount : 0),
        codCollectedAmount: j.codCollectedAmount || 0,
        codStatus: j.codStatus || (j.paymentMethod === 'COD' ? (j.status === 'COMPLETED' ? 'COLLECTED' : 'PENDING') : 'NOT_APPLICABLE'),
        paymentMethod: j.paymentMethod || 'COD',
        paymentStatus: j.paymentStatus || 'PAID',
        settlementStatus: j.settlementStatus || (j.status === 'COMPLETED' ? 'ELIGIBLE' : 'NOT_ELIGIBLE'),
        refundStatus: j.refundStatus || 'NOT_APPLICABLE',
        codCollection: fallbackLaundryCodCollections.find(c => c.laundryOrderId === j.id) || null
      }))));
    },
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const orderNumber = args?.where?.orderNumber;
      const j = fallbackLaundryJobs.find((item) => (id && item.id === id) || (orderNumber && item.orderNumber === orderNumber)) as any;
      if (!j) return null;
      return JSON.parse(JSON.stringify({
        ...j,
        laundryBaseAmount: j.laundryBaseAmount !== undefined ? j.laundryBaseAmount : (j.finalPrice || j.estimatedPrice || 0) * 0.95,
        serviceChargeAmount: j.serviceChargeAmount !== undefined ? j.serviceChargeAmount : (j.finalPrice || j.estimatedPrice || 0) * 0.05,
        totalAmount: j.totalAmount || j.finalPrice || j.estimatedPrice || 0,
        onlinePaidAmount: j.onlinePaidAmount !== undefined ? j.onlinePaidAmount : (j.paymentMethod === 'ONLINE' ? j.totalAmount : j.serviceChargeAmount),
        codAmount: j.codAmount !== undefined ? j.codAmount : (j.paymentMethod === 'COD' ? j.laundryBaseAmount : 0),
        codCollectedAmount: j.codCollectedAmount || 0,
        codStatus: j.codStatus || (j.paymentMethod === 'COD' ? (j.status === 'COMPLETED' ? 'COLLECTED' : 'PENDING') : 'NOT_APPLICABLE'),
        paymentMethod: j.paymentMethod || 'COD',
        paymentStatus: j.paymentStatus || 'PAID',
        settlementStatus: j.settlementStatus || (j.status === 'COMPLETED' ? 'ELIGIBLE' : 'NOT_ELIGIBLE'),
        refundStatus: j.refundStatus || 'NOT_APPLICABLE',
        items: j.items || [],
        photos: j.photos || [],
        otps: j.otps || [],
        statusHistory: j.statusHistory || [],
        codCollection: fallbackLaundryCodCollections.find(c => c.laundryOrderId === j.id) || null
      }));
    },
    create: async (args: any) => {
      const itemsData = args.data.items?.create || [];
      const otpsData = args.data.otps?.create || [];
      const historyData = args.data.statusHistory?.create;
      const orderId = `lnd_${Date.now()}`;
      const totalAmount = Number(args.data.totalAmount || args.data.estimatedPrice || 100);
      const baseAmount = args.data.laundryBaseAmount !== undefined ? Number(args.data.laundryBaseAmount) : totalAmount * 0.95;
      const scAmount = args.data.serviceChargeAmount !== undefined ? Number(args.data.serviceChargeAmount) : totalAmount * 0.05;

      const newJob = {
        id: orderId,
        orderNumber: args.data.orderNumber || `NIT-LND-${Math.floor(100 + Math.random() * 900)}`,
        trackingNumber: args.data.trackingNumber || `TRK-${orderId}`,
        qrCodeData: args.data.qrCodeData || '{}',
        studentId: args.data.studentId,
        providerId: args.data.providerId || 'prov_laundry',
        deliveryBoyId: args.data.deliveryBoyId || null,
        status: args.data.status || 'REQUESTED',
        estimatedPrice: totalAmount,
        finalPrice: args.data.finalPrice || totalAmount,
        laundryBaseAmount: baseAmount,
        serviceChargeAmount: scAmount,
        totalAmount,
        onlinePaidAmount: args.data.onlinePaidAmount !== undefined ? Number(args.data.onlinePaidAmount) : 0,
        codAmount: args.data.codAmount !== undefined ? Number(args.data.codAmount) : 0,
        codCollectedAmount: 0,
        codStatus: args.data.codStatus || (args.data.paymentMethod === 'COD' ? 'PENDING' : 'NOT_APPLICABLE'),
        paymentMethod: args.data.paymentMethod || 'COD',
        paymentStatus: args.data.paymentStatus || 'PENDING',
        settlementStatus: args.data.settlementStatus || 'NOT_ELIGIBLE',
        refundStatus: args.data.refundStatus || 'NOT_APPLICABLE',
        serviceChargeRefundable: args.data.serviceChargeRefundable !== undefined ? args.data.serviceChargeRefundable : true,
        priceSnapshotJson: args.data.priceSnapshotJson || null,
        serviceConfigId: args.data.serviceConfigId || null,
        hallName: args.data.hallName || 'Hall 11',
        hallNumber: args.data.hallNumber || null,
        roomNumber: args.data.roomNumber || '101',
        pickupDate: args.data.pickupDate || new Date(),
        preferredPickupTime: args.data.preferredPickupTime || '08:00 AM - 10:00 AM',
        preferredReturnTime: args.data.preferredReturnTime || '05:00 PM - 07:00 PM',
        specialInstructions: args.data.specialInstructions || null,
        items: itemsData.map((i: any, idx: number) => ({
          id: `li_${Date.now()}_${idx}`,
          itemType: i.itemType,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        })),
        otps: otpsData.map((o: any, idx: number) => ({
          id: `otp_${Date.now()}_${idx}`,
          laundryOrderId: orderId,
          ...o,
          isUsed: false,
          attempts: 0,
          createdAt: new Date()
        })),
        statusHistory: historyData ? [{ id: `lh_${Date.now()}`, ...historyData, createdAt: new Date() }] : [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      fallbackLaundryJobs.unshift(newJob as any);
      return JSON.parse(JSON.stringify(newJob));
    },
    update: async (args: any) => {
      const job = fallbackLaundryJobs.find((j) => j.id === args.where.id || j.orderNumber === args.where.orderNumber) as any;
      if (job) {
        Object.assign(job, args.data);
        if (args.data.statusHistory?.create) {
          if (!Array.isArray(job.statusHistory)) job.statusHistory = [];
          job.statusHistory.push({ id: `lh_${Date.now()}`, ...args.data.statusHistory.create, createdAt: new Date() });
        }
        job.updatedAt = new Date();
        return JSON.parse(JSON.stringify(job));
      }
      return args.data;
    }
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
    count: async () => ((global as any).__mockRefunds?.length || 1),
    findMany: async (args?: any) => {
      if (!(global as any).__mockRefunds) (global as any).__mockRefunds = [];
      let list = [...(global as any).__mockRefunds];
      if (args?.where?.orderId) list = list.filter((r: any) => r.orderId === args.where.orderId);
      if (args?.where?.status) list = list.filter((r: any) => r.status === args.where.status);
      return JSON.parse(JSON.stringify(list));
    },
    findFirst: async (args?: any) => {
      if (!(global as any).__mockRefunds) (global as any).__mockRefunds = [];
      const found = (global as any).__mockRefunds.find((r: any) =>
        (args?.where?.orderId && r.orderId === args.where.orderId) ||
        (args?.where?.id && r.id === args.where.id)
      );
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },
    findUnique: async (args?: any) => {
      if (!(global as any).__mockRefunds) (global as any).__mockRefunds = [];
      const found = (global as any).__mockRefunds.find((r: any) => r.id === args?.where?.id);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },
    create: async (args: any) => {
      if (!(global as any).__mockRefunds) (global as any).__mockRefunds = [];
      const newRefund = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        refundNumber: args.data.refundNumber || `CB-REF-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: args.data.status || 'REQUESTED',
        ...args.data
      };
      (global as any).__mockRefunds.push(newRefund);

      const ord = fallbackOrders.find((o: any) => o.id === newRefund.orderId);
      if (ord) {
        if (!Array.isArray((ord as any).refunds)) (ord as any).refunds = [];
        (ord as any).refunds.push(newRefund);
        (ord as any).refundAmount = Number(newRefund.amount);
      }

      return JSON.parse(JSON.stringify(newRefund));
    },
    update: async (args: any) => {
      if (!(global as any).__mockRefunds) (global as any).__mockRefunds = [];
      const r = (global as any).__mockRefunds.find((item: any) => item.id === args.where.id);
      if (r) {
        Object.assign(r, args.data, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(r));
      }
      return args.data;
    },
    updateMany: async (args: any) => {
      if (!(global as any).__mockRefunds) (global as any).__mockRefunds = [];
      let count = 0;
      for (const r of (global as any).__mockRefunds) {
        if (args.where?.orderId && r.orderId === args.where.orderId) {
          Object.assign(r, args.data, { updatedAt: new Date() });
          count++;
        }
      }
      return { count };
    }
  },
  financialLedger: {
    findMany: async (args?: any) => {
      let entries = [...fallbackFinancialLedger];
      if (args?.where?.orderId) entries = entries.filter(e => e.orderId === args.where.orderId);
      if (args?.where?.settlementId) entries = entries.filter(e => e.settlementId === args.where.settlementId);
      if (args?.where?.entryType) entries = entries.filter(e => e.entryType === args.where.entryType);
      if (args?.take) entries = entries.slice(0, args.take);
      return JSON.parse(JSON.stringify(entries.map(e => ({ isImmutable: true, balanceAfter: 500, ...e }))));
    },
    findUnique: async (args: any) => {
      const e = fallbackFinancialLedger.find(item => item.id === args.where.id);
      return e ? JSON.parse(JSON.stringify({ isImmutable: true, balanceAfter: 500, ...e })) : null;
    },
    create: async (args: any) => {
      const entry = {
        id: `fl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date(),
        isImmutable: true,
        balanceAfter: Number(args.data.amount) || 500,
        ...args.data
      };
      fallbackFinancialLedger.unshift(entry);
      return JSON.parse(JSON.stringify(entry));
    },
    count: async () => fallbackFinancialLedger.length
  },
  settlement: {
    findMany: async (args?: any) => {
      let stls = [...fallbackSettlements];
      if (args?.where?.providerId) stls = stls.filter(s => s.providerId === args.where.providerId);
      if (args?.where?.status) stls = stls.filter(s => s.status === args.where.status);
      return JSON.parse(JSON.stringify(stls.map(s => {
        const provUser = fallbackUsers.find(u => u.provider?.id === s.providerId);
        return {
          ...s,
          provider: provUser?.provider ? { fullName: provUser.provider.fullName, mobileNumber: provUser.provider.mobileNumber, serviceCategory: provUser.provider.serviceCategory } : null,
          items: fallbackSettlementItems.filter(si => si.settlementId === s.id)
        };
      })));
    },
    findUnique: async (args: any) => {
      const s = fallbackSettlements.find(item => item.id === args.where.id);
      if (!s) return null;
      const provUser = fallbackUsers.find(u => u.provider?.id === s.providerId);
      return JSON.parse(JSON.stringify({
        ...s,
        provider: provUser?.provider ? { fullName: provUser.provider.fullName, mobileNumber: provUser.provider.mobileNumber, serviceCategory: provUser.provider.serviceCategory } : null,
        items: fallbackSettlementItems.filter(si => si.settlementId === s.id)
      }));
    },
    create: async (args: any) => {
      const stl = { id: `stl_${Date.now()}`, settlementNumber: `STL-${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
      fallbackSettlements.unshift(stl);
      return JSON.parse(JSON.stringify(stl));
    },
    update: async (args: any) => {
      const s = fallbackSettlements.find(item => item.id === args.where.id);
      if (s) {
        Object.assign(s, args.data, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(s));
      }
      return args.data;
    },
    count: async () => fallbackSettlements.length
  },
  settlementItem: {
    findMany: async (args?: any) => {
      let items = [...fallbackSettlementItems];
      if (args?.where?.settlementId) items = items.filter(i => i.settlementId === args.where.settlementId);
      return JSON.parse(JSON.stringify(items));
    },
    create: async (args: any) => {
      const it = { id: `si_${Date.now()}`, ...args.data };
      fallbackSettlementItems.push(it);
      return it;
    },
    createMany: async (args: any) => {
      const created = (args.data || []).map((d: any) => ({ id: `si_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...d }));
      fallbackSettlementItems.push(...created);
      return { count: created.length };
    }
  },
  cODCollection: {
    findMany: async (args?: any) => {
      let cols = [...fallbackCodCollections];
      if (args?.where?.deliveryBoyId) cols = cols.filter(c => c.deliveryBoyId === args.where.deliveryBoyId);
      if (args?.where?.reconciliationStatus) cols = cols.filter(c => c.reconciliationStatus === args.where.reconciliationStatus);
      return JSON.parse(JSON.stringify(cols.map(c => {
        const ord = fallbackOrders.find(o => o.id === c.orderId);
        const dbUser = fallbackUsers.find(u => u.deliveryBoy?.id === c.deliveryBoyId);
        return {
          ...c,
          order: ord ? { id: ord.id, orderNumber: ord.orderNumber, totalAmount: ord.totalAmount, student: ord.student } : null,
          deliveryBoy: dbUser?.deliveryBoy ? { id: dbUser.deliveryBoy.id, fullName: dbUser.deliveryBoy.fullName, mobileNumber: dbUser.deliveryBoy.mobileNumber } : null
        };
      })));
    },
    findUnique: async (args: any) => {
      const c = fallbackCodCollections.find(item => item.id === args.where.id || item.orderId === args.where.orderId);
      if (!c) return null;
      const ord = fallbackOrders.find(o => o.id === c.orderId);
      const dbUser = fallbackUsers.find(u => u.deliveryBoy?.id === c.deliveryBoyId);
      return JSON.parse(JSON.stringify({
        ...c,
        order: ord ? { id: ord.id, orderNumber: ord.orderNumber, totalAmount: ord.totalAmount, student: ord.student } : null,
        deliveryBoy: dbUser?.deliveryBoy ? { id: dbUser.deliveryBoy.id, fullName: dbUser.deliveryBoy.fullName, mobileNumber: dbUser.deliveryBoy.mobileNumber } : null
      }));
    },
    create: async (args: any) => {
      const col = { id: `cod_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
      fallbackCodCollections.unshift(col);
      return JSON.parse(JSON.stringify(col));
    },
    update: async (args: any) => {
      const c = fallbackCodCollections.find(item => item.id === args.where.id || item.orderId === args.where.orderId);
      if (c) {
        Object.assign(c, args.data, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(c));
      }
      return args.data;
    },
    upsert: async (args: any) => {
      const orderId = args.where?.orderId || args.create?.orderId;
      const id = args.where?.id;
      let existing = fallbackCodCollections.find(item => (orderId && item.orderId === orderId) || (id && item.id === id));
      if (existing) {
        Object.assign(existing, args.update, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(existing));
      }
      const newCol = { id: `cod_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.create };
      fallbackCodCollections.unshift(newCol);
      return JSON.parse(JSON.stringify(newCol));
    },
    count: async () => fallbackCodCollections.length
  },
  adminStatusOverride: {
    findMany: async (args?: any) => {
      let list = [...fallbackAdminStatusOverrides];
      if (args?.where?.orderId) list = list.filter(l => l.orderId === args.where.orderId);
      return JSON.parse(JSON.stringify(list));
    },
    create: async (args: any) => {
      const ov = { id: `aso_${Date.now()}`, createdAt: new Date(), ...args.data };
      fallbackAdminStatusOverrides.unshift(ov);
      return JSON.parse(JSON.stringify(ov));
    }
  },
  cancellationRequest: {
    findMany: async (args?: any) => {
      let list = [...fallbackCancellationRequests];
      if (args?.where?.orderId) list = list.filter(l => l.orderId === args.where.orderId);
      return JSON.parse(JSON.stringify(list));
    },
    findFirst: async (args?: any) => {
      const c = fallbackCancellationRequests.find(item => (args?.where?.orderId && item.orderId === args.where.orderId) || (args?.where?.id && item.id === args.where.id));
      return c ? JSON.parse(JSON.stringify(c)) : null;
    },
    findUnique: async (args: any) => fallbackCancellationRequests.find(c => c.id === args.where.id || c.orderId === args.where.orderId) || null,
    create: async (args: any) => {
      const cr = { id: `cnl_${Date.now()}`, createdAt: new Date(), ...args.data };
      fallbackCancellationRequests.unshift(cr);
      return JSON.parse(JSON.stringify(cr));
    },
    update: async (args: any) => {
      const c = fallbackCancellationRequests.find(item => item.id === args.where.id || item.orderId === args.where.orderId);
      if (c) {
        Object.assign(c, args.data);
        return JSON.parse(JSON.stringify(c));
      }
      return args.data;
    },
    upsert: async (args: any) => {
      const existing = fallbackCancellationRequests.find(item => item.orderId === args.where.orderId || item.id === args.where.id);
      if (existing) {
        Object.assign(existing, args.update);
        return JSON.parse(JSON.stringify(existing));
      }
      const cr = { id: `cnl_${Date.now()}`, createdAt: new Date(), ...args.create };
      fallbackCancellationRequests.unshift(cr);
      return JSON.parse(JSON.stringify(cr));
    }
  },
  returnRequest: {
    findMany: async (args?: any) => {
      let list = [...fallbackReturnRequests];
      if (args?.where?.orderId) list = list.filter(l => l.orderId === args.where.orderId);
      if (args?.where?.studentId) list = list.filter(l => l.studentId === args.where.studentId);
      if (args?.where?.deliveryBoyId) list = list.filter(l => l.deliveryBoyId === args.where.deliveryBoyId);
      if (args?.where?.status) {
        if (args.where.status.in && Array.isArray(args.where.status.in)) {
          list = list.filter(l => args.where.status.in.includes(l.status));
        } else if (typeof args.where.status === 'string') {
          list = list.filter(l => l.status === args.where.status);
        }
      }
      const enrich = (r: any): any => {
        const rawOrder: any = fallbackOrders.find((o: any) => o.id === r.orderId);
        let order: any = null;
        if (rawOrder) {
          const studentUser: any = fallbackUsers.find((u: any) => u.student?.id === rawOrder.studentId);
          const provUser: any = fallbackUsers.find((u: any) => u.provider?.id === rawOrder.providerId);
          const dbUser: any = rawOrder.deliveryBoyId ? fallbackUsers.find((u: any) => u.deliveryBoy?.id === rawOrder.deliveryBoyId) : null;
          order = {
            ...rawOrder,
            student: rawOrder.student || (studentUser?.student ? {
              fullName: studentUser.student.fullName,
              mobileNumber: studentUser.student.mobileNumber,
              roomNumber: studentUser.student.roomNumber,
              hallName: studentUser.student.hallName || (studentUser.student as any).hallNumber,
              user: { email: studentUser.email }
            } : null),
            provider: rawOrder.provider || (provUser?.provider ? {
              fullName: provUser.provider.fullName,
              mobileNumber: provUser.provider.mobileNumber,
              serviceCategory: provUser.provider.serviceCategory
            } : null),
            deliveryBoy: rawOrder.deliveryBoy || (dbUser?.deliveryBoy ? {
              id: dbUser.deliveryBoy.id,
              fullName: dbUser.deliveryBoy.fullName,
              mobileNumber: dbUser.deliveryBoy.mobileNumber,
              vehicleType: dbUser.deliveryBoy.vehicleType
            } : null),
            items: rawOrder.items || [],
            payment: rawOrder.payment || null
          };
        }
        const pickupDbUser: any = r.deliveryBoyId ? fallbackUsers.find((u: any) => u.deliveryBoy?.id === r.deliveryBoyId) : null;
        const deliveryFeeDeducted = r.deliveryFeeDeducted !== undefined ? r.deliveryFeeDeducted : (r.deliveryChargeDeducted || 0);
        return {
          ...r,
          deliveryFeeDeducted,
          deliveryChargeDeducted: deliveryFeeDeducted,
          order,
          deliveryBoy: pickupDbUser?.deliveryBoy ? {
            id: pickupDbUser.deliveryBoy.id,
            fullName: pickupDbUser.deliveryBoy.fullName,
            mobileNumber: pickupDbUser.deliveryBoy.mobileNumber,
            vehicleType: pickupDbUser.deliveryBoy.vehicleType
          } : (r.deliveryBoy || null)
        };
      };
      return JSON.parse(JSON.stringify(list.map(enrich)));
    },
    findFirst: async (args?: any) => {
      const orList = args?.where?.OR;
      let targetId = args?.where?.id;
      let targetOrderId = args?.where?.orderId;
      if (Array.isArray(orList)) {
        for (const cond of orList) {
          if (cond.id) targetId = cond.id;
          if (cond.orderId) targetOrderId = cond.orderId;
        }
      }
      const r = fallbackReturnRequests.find(item => (targetOrderId && item.orderId === targetOrderId) || (targetId && item.id === targetId));
      if (!r) return null;
      const rawOrder: any = fallbackOrders.find((o: any) => o.id === r.orderId);
      let order: any = null;
      if (rawOrder) {
        const studentUser: any = fallbackUsers.find((u: any) => u.student?.id === rawOrder.studentId);
        const provUser: any = fallbackUsers.find((u: any) => u.provider?.id === rawOrder.providerId);
        const dbUser: any = rawOrder.deliveryBoyId ? fallbackUsers.find((u: any) => u.deliveryBoy?.id === rawOrder.deliveryBoyId) : null;
        order = {
          ...rawOrder,
          student: rawOrder.student || (studentUser?.student ? {
            fullName: studentUser.student.fullName,
            mobileNumber: studentUser.student.mobileNumber,
            roomNumber: studentUser.student.roomNumber,
            hallName: studentUser.student.hallName || (studentUser.student as any).hallNumber,
            user: { email: studentUser.email }
          } : null),
          provider: rawOrder.provider || (provUser?.provider ? {
            fullName: provUser.provider.fullName,
            mobileNumber: provUser.provider.mobileNumber,
            serviceCategory: provUser.provider.serviceCategory
          } : null),
          deliveryBoy: rawOrder.deliveryBoy || (dbUser?.deliveryBoy ? {
            id: dbUser.deliveryBoy.id,
            fullName: dbUser.deliveryBoy.fullName,
            mobileNumber: dbUser.deliveryBoy.mobileNumber,
            vehicleType: dbUser.deliveryBoy.vehicleType
          } : null),
          items: rawOrder.items || [],
          payment: rawOrder.payment || null
        };
      }
      const pickupDbUser: any = r.deliveryBoyId ? fallbackUsers.find((u: any) => u.deliveryBoy?.id === r.deliveryBoyId) : null;
      const deliveryFeeDeducted = r.deliveryFeeDeducted !== undefined ? r.deliveryFeeDeducted : (r.deliveryChargeDeducted || 0);
      return JSON.parse(JSON.stringify({
        ...r,
        deliveryFeeDeducted,
        deliveryChargeDeducted: deliveryFeeDeducted,
        order,
        deliveryBoy: pickupDbUser?.deliveryBoy ? {
          id: pickupDbUser.deliveryBoy.id,
          fullName: pickupDbUser.deliveryBoy.fullName,
          mobileNumber: pickupDbUser.deliveryBoy.mobileNumber,
          vehicleType: pickupDbUser.deliveryBoy.vehicleType
        } : (r.deliveryBoy || null)
      }));
    },
    findUnique: async (args: any) => {
      const orList = args?.where?.OR;
      let targetId = args?.where?.id;
      let targetOrderId = args?.where?.orderId;
      if (Array.isArray(orList)) {
        for (const cond of orList) {
          if (cond.id) targetId = cond.id;
          if (cond.orderId) targetOrderId = cond.orderId;
        }
      }
      const r = fallbackReturnRequests.find(c => (targetId && c.id === targetId) || (targetOrderId && c.orderId === targetOrderId));
      if (!r) return null;
      const rawOrder: any = fallbackOrders.find((o: any) => o.id === r.orderId);
      let order: any = null;
      if (rawOrder) {
        const studentUser: any = fallbackUsers.find((u: any) => u.student?.id === rawOrder.studentId);
        const provUser: any = fallbackUsers.find((u: any) => u.provider?.id === rawOrder.providerId);
        const dbUser: any = rawOrder.deliveryBoyId ? fallbackUsers.find((u: any) => u.deliveryBoy?.id === rawOrder.deliveryBoyId) : null;
        order = {
          ...rawOrder,
          student: rawOrder.student || (studentUser?.student ? {
            fullName: studentUser.student.fullName,
            mobileNumber: studentUser.student.mobileNumber,
            roomNumber: studentUser.student.roomNumber,
            hallName: studentUser.student.hallName || (studentUser.student as any).hallNumber,
            user: { email: studentUser.email }
          } : null),
          provider: rawOrder.provider || (provUser?.provider ? {
            fullName: provUser.provider.fullName,
            mobileNumber: provUser.provider.mobileNumber,
            serviceCategory: provUser.provider.serviceCategory
          } : null),
          deliveryBoy: rawOrder.deliveryBoy || (dbUser?.deliveryBoy ? {
            id: dbUser.deliveryBoy.id,
            fullName: dbUser.deliveryBoy.fullName,
            mobileNumber: dbUser.deliveryBoy.mobileNumber,
            vehicleType: dbUser.deliveryBoy.vehicleType
          } : null),
          items: rawOrder.items || [],
          payment: rawOrder.payment || null
        };
      }
      const pickupDbUser: any = r.deliveryBoyId ? fallbackUsers.find((u: any) => u.deliveryBoy?.id === r.deliveryBoyId) : null;
      const deliveryFeeDeducted = r.deliveryFeeDeducted !== undefined ? r.deliveryFeeDeducted : (r.deliveryChargeDeducted || 0);
      return JSON.parse(JSON.stringify({
        ...r,
        deliveryFeeDeducted,
        deliveryChargeDeducted: deliveryFeeDeducted,
        order,
        deliveryBoy: pickupDbUser?.deliveryBoy ? {
          id: pickupDbUser.deliveryBoy.id,
          fullName: pickupDbUser.deliveryBoy.fullName,
          mobileNumber: pickupDbUser.deliveryBoy.mobileNumber,
          vehicleType: pickupDbUser.deliveryBoy.vehicleType
        } : (r.deliveryBoy || null)
      }));
    },
    create: async (args: any) => {
      const deliveryFee = args.data.deliveryFeeDeducted !== undefined ? args.data.deliveryFeeDeducted : (args.data.deliveryChargeDeducted || 0);
      const rr = {
        id: `ret_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        pickupOtpVerified: false,
        deliveryBoyPayout: 15,
        ...args.data,
        deliveryFeeDeducted: deliveryFee,
        deliveryChargeDeducted: deliveryFee
      };
      fallbackReturnRequests.unshift(rr);
      return JSON.parse(JSON.stringify(rr));
    },
    update: async (args: any) => {
      const orList = args?.where?.OR;
      let targetId = args?.where?.id;
      let targetOrderId = args?.where?.orderId;
      if (Array.isArray(orList)) {
        for (const cond of orList) {
          if (cond.id) targetId = cond.id;
          if (cond.orderId) targetOrderId = cond.orderId;
        }
      }
      const r = fallbackReturnRequests.find(item => (targetId && item.id === targetId) || (targetOrderId && item.orderId === targetOrderId));
      if (r) {
        Object.assign(r, { ...args.data, updatedAt: new Date() });
        if (args.data.deliveryFeeDeducted !== undefined) {
          r.deliveryChargeDeducted = args.data.deliveryFeeDeducted;
        }
        const rawOrder: any = fallbackOrders.find((o: any) => o.id === r.orderId);
        let order: any = null;
        if (rawOrder) {
          const studentUser: any = fallbackUsers.find((u: any) => u.student?.id === rawOrder.studentId);
          const provUser: any = fallbackUsers.find((u: any) => u.provider?.id === rawOrder.providerId);
          const dbUser: any = rawOrder.deliveryBoyId ? fallbackUsers.find((u: any) => u.deliveryBoy?.id === rawOrder.deliveryBoyId) : null;
          order = {
            ...rawOrder,
            student: rawOrder.student || (studentUser?.student ? {
              fullName: studentUser.student.fullName,
              mobileNumber: studentUser.student.mobileNumber,
              roomNumber: studentUser.student.roomNumber,
              hallName: studentUser.student.hallName || (studentUser.student as any).hallNumber,
              user: { email: studentUser.email }
            } : null),
            provider: rawOrder.provider || (provUser?.provider ? {
              fullName: provUser.provider.fullName,
              mobileNumber: provUser.provider.mobileNumber,
              serviceCategory: provUser.provider.serviceCategory
            } : null),
            deliveryBoy: rawOrder.deliveryBoy || (dbUser?.deliveryBoy ? {
              id: dbUser.deliveryBoy.id,
              fullName: dbUser.deliveryBoy.fullName,
              mobileNumber: dbUser.deliveryBoy.mobileNumber,
              vehicleType: dbUser.deliveryBoy.vehicleType
            } : null),
            items: rawOrder.items || [],
            payment: rawOrder.payment || null
          };
        }
        const pickupDbUser: any = r.deliveryBoyId ? fallbackUsers.find((u: any) => u.deliveryBoy?.id === r.deliveryBoyId) : null;
        const deliveryFeeDeducted = r.deliveryFeeDeducted !== undefined ? r.deliveryFeeDeducted : (r.deliveryChargeDeducted || 0);
        return JSON.parse(JSON.stringify({
          ...r,
          deliveryFeeDeducted,
          deliveryChargeDeducted: deliveryFeeDeducted,
          order,
          deliveryBoy: pickupDbUser?.deliveryBoy ? {
            id: pickupDbUser.deliveryBoy.id,
            fullName: pickupDbUser.deliveryBoy.fullName,
            mobileNumber: pickupDbUser.deliveryBoy.mobileNumber,
            vehicleType: pickupDbUser.deliveryBoy.vehicleType
          } : (r.deliveryBoy || null)
        }));
      }
      return args.data;
    },
    upsert: async (args: any) => {
      const existing = fallbackReturnRequests.find(item => (args.where.orderId && item.orderId === args.where.orderId) || (args.where.id && item.id === args.where.id));
      if (existing) {
        Object.assign(existing, { ...args.update, updatedAt: new Date() });
        const deliveryFee = args.update.deliveryFeeDeducted !== undefined ? args.update.deliveryFeeDeducted : (args.update.deliveryChargeDeducted !== undefined ? args.update.deliveryChargeDeducted : existing.deliveryFeeDeducted);
        existing.deliveryFeeDeducted = deliveryFee;
        existing.deliveryChargeDeducted = deliveryFee;
        return JSON.parse(JSON.stringify(existing));
      }
      const deliveryFee = args.create.deliveryFeeDeducted !== undefined ? args.create.deliveryFeeDeducted : (args.create.deliveryChargeDeducted || 0);
      const rr = {
        id: `ret_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.create,
        deliveryFeeDeducted: deliveryFee,
        deliveryChargeDeducted: deliveryFee
      };
      fallbackReturnRequests.unshift(rr);
      return JSON.parse(JSON.stringify(rr));
    }
  },
  refundAccount: {
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const studentId = args?.where?.studentId;
      return fallbackRefundAccounts.find(r => (id && r.id === id) || (studentId && r.studentId === studentId)) || null;
    },
    findFirst: async (args: any) => {
      const studentId = args?.where?.studentId;
      return fallbackRefundAccounts.find(r => r.studentId === studentId) || null;
    },
    findMany: async (args?: any) => {
      let list = [...fallbackRefundAccounts];
      if (args?.where?.studentId) list = list.filter(r => r.studentId === args.where.studentId);
      return JSON.parse(JSON.stringify(list));
    },
    create: async (args: any) => {
      const rfa = { id: `rfa_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
      fallbackRefundAccounts.unshift(rfa);
      return JSON.parse(JSON.stringify(rfa));
    },
    update: async (args: any) => {
      const r = fallbackRefundAccounts.find(item => item.id === args.where.id || item.studentId === args.where.studentId);
      if (r) {
        Object.assign(r, args.data, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(r));
      }
      return args.data;
    },
    upsert: async (args: any) => {
      const existing = fallbackRefundAccounts.find(item => item.studentId === args.where.studentId);
      if (existing) {
        Object.assign(existing, args.update, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(existing));
      }
      const created = { id: `rfa_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.create };
      fallbackRefundAccounts.unshift(created);
      return JSON.parse(JSON.stringify(created));
    }
  },
  providerSettlementAccount: {
    findUnique: async (args: any) => {
      const id = args?.where?.id;
      const providerId = args?.where?.providerId;
      return fallbackProviderSettlementAccounts.find(p => (id && p.id === id) || (providerId && p.providerId === providerId)) || null;
    },
    findFirst: async (args: any) => {
      const providerId = args?.where?.providerId;
      return fallbackProviderSettlementAccounts.find(p => p.providerId === providerId) || null;
    },
    findMany: async (args?: any) => {
      let list = [...fallbackProviderSettlementAccounts];
      if (args?.where?.providerId) list = list.filter(p => p.providerId === args.where.providerId);
      return JSON.parse(JSON.stringify(list));
    },
    create: async (args: any) => {
      const psa = { id: `psa_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
      fallbackProviderSettlementAccounts.unshift(psa);
      return JSON.parse(JSON.stringify(psa));
    },
    update: async (args: any) => {
      const p = fallbackProviderSettlementAccounts.find(item => item.id === args.where.id || item.providerId === args.where.providerId);
      if (p) {
        Object.assign(p, args.data, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(p));
      }
      return args.data;
    },
    upsert: async (args: any) => {
      const existing = fallbackProviderSettlementAccounts.find(item => item.providerId === args.where.providerId);
      if (existing) {
        Object.assign(existing, args.update, { updatedAt: new Date() });
        return JSON.parse(JSON.stringify(existing));
      }
      const created = { id: `psa_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.create };
      fallbackProviderSettlementAccounts.unshift(created);
      return JSON.parse(JSON.stringify(created));
    }
  },
  laundryProviderConfig: {
    findUnique: async (args: any) => fallbackLaundryProviderConfigs.find(l => l.providerId === args.where.providerId || l.id === args.where.id) || null,
    findFirst: async (args: any) => fallbackLaundryProviderConfigs.find(l => l.providerId === args.where.providerId) || null,
    create: async (args: any) => {
      const c = { id: `lpc_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
      fallbackLaundryProviderConfigs.push(c);
      return c;
    },
    update: async (args: any) => {
      const c = fallbackLaundryProviderConfigs.find(l => l.providerId === args.where.providerId || l.id === args.where.id);
      if (c) {
        Object.assign(c, args.data, { updatedAt: new Date() });
        return c;
      }
      return args.data;
    },
    upsert: async (args: any) => {
      const existing = fallbackLaundryProviderConfigs.find(l => l.providerId === args.where.providerId);
      if (existing) {
        Object.assign(existing, args.update, { updatedAt: new Date() });
        return existing;
      }
      const created = { id: `lpc_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.create };
      fallbackLaundryProviderConfigs.push(created);
      return created;
    }
  },
  foodOrderDetails: {
    findUnique: async (args: any) => fallbackFoodOrderDetails.find(f => f.orderId === args.where.orderId || f.id === args.where.id) || null,
    findFirst: async (args: any) => fallbackFoodOrderDetails.find(f => f.orderId === args.where.orderId) || null,
    create: async (args: any) => {
      const f = { id: `fod_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
      fallbackFoodOrderDetails.push(f);
      return f;
    },
    update: async (args: any) => {
      const f = fallbackFoodOrderDetails.find(item => item.orderId === args.where.orderId || item.id === args.where.id);
      if (f) {
        Object.assign(f, args.data, { updatedAt: new Date() });
        return f;
      }
      return args.data;
    }
  },
  laundryOrderDetails: {
    findUnique: async (args: any) => fallbackLaundryOrderDetails.find(l => l.orderId === args.where.orderId || l.id === args.where.id) || null,
    findFirst: async (args: any) => fallbackLaundryOrderDetails.find(l => l.orderId === args.where.orderId) || null,
    create: async (args: any) => {
      const l = { id: `lod_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
      fallbackLaundryOrderDetails.push(l);
      return l;
    },
    update: async (args: any) => {
      const l = fallbackLaundryOrderDetails.find(item => item.orderId === args.where.orderId || item.id === args.where.id);
      if (l) {
        Object.assign(l, args.data, { updatedAt: new Date() });
        return l;
      }
      return args.data;
    }
  },
  produceOrderDetails: {
    findUnique: async (args: any) => fallbackProduceOrderDetails.find(p => p.orderId === args.where.orderId || p.id === args.where.id) || null,
    findFirst: async (args: any) => fallbackProduceOrderDetails.find(p => p.orderId === args.where.orderId) || null,
    create: async (args: any) => {
      const p = { id: `pod_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
      fallbackProduceOrderDetails.push(p);
      return p;
    },
    update: async (args: any) => {
      const p = fallbackProduceOrderDetails.find(item => item.orderId === args.where.orderId || item.id === args.where.id);
      if (p) {
        Object.assign(p, args.data, { updatedAt: new Date() });
        return p;
      }
      return args.data;
    }
  },
  stationeryOrderDetails: {
    findUnique: async (args: any) => fallbackStationeryOrderDetails.find(s => s.orderId === args.where.orderId || s.id === args.where.id) || null,
    findFirst: async (args: any) => fallbackStationeryOrderDetails.find(s => s.orderId === args.where.orderId) || null,
    create: async (args: any) => {
      const s = { id: `sod_${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...args.data };
      fallbackStationeryOrderDetails.push(s);
      return s;
    },
    update: async (args: any) => {
      const s = fallbackStationeryOrderDetails.find(item => item.orderId === args.where.orderId || item.id === args.where.id);
      if (s) {
        Object.assign(s, args.data, { updatedAt: new Date() });
        return s;
      }
      return args.data;
    }
  },
  payment: {
    count: async () => ((global as any).__mockPayments?.length || 0),
    findFirst: async (args: any) => {
      if (!(global as any).__mockPayments) (global as any).__mockPayments = [];
      const found = (global as any).__mockPayments.find((p: any) => 
        (args?.where?.razorpayOrderId && p.razorpayOrderId === args.where.razorpayOrderId) ||
        (args?.where?.id && p.id === args.where.id)
      );
      if (!found) return null;
      // Attach related order/laundryOrder if requested
      const order = fallbackOrders.find((o) => o.id === found.orderId) || null;
      const laundryOrder = fallbackLaundryJobs.find((l) => l.id === found.laundryOrderId) || null;
      return { ...found, order, laundryOrder };
    },
    findUnique: async (args: any) => {
      if (!(global as any).__mockPayments) (global as any).__mockPayments = [];
      const found = (global as any).__mockPayments.find((p: any) => p.id === args?.where?.id);
      if (!found) return null;
      const order = fallbackOrders.find((o) => o.id === found.orderId) || null;
      const laundryOrder = fallbackLaundryJobs.find((l) => l.id === found.laundryOrderId) || null;
      return { ...found, order, laundryOrder };
    },
    create: async (args: any) => {
      if (!(global as any).__mockPayments) (global as any).__mockPayments = [];
      const newPayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'PENDING',
        ...args.data
      };
      (global as any).__mockPayments.push(newPayment);
      return newPayment;
    },
    update: async (args: any) => {
      if (!(global as any).__mockPayments) (global as any).__mockPayments = [];
      const p = (global as any).__mockPayments.find((item: any) => item.id === args.where.id);
      if (p) {
        Object.assign(p, args.data, { updatedAt: new Date() });
        return p;
      }
      return args.data;
    }
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
                // If query fails due to connection error, validation error, or missing table, use fallback
                if (
                  !global.isDatabaseHealthy ||
                  err?.name === 'PrismaClientInitializationError' ||
                  err?.name === 'PrismaClientValidationError' ||
                  err?.name === 'PrismaClientKnownRequestError' ||
                  err?.code === 'P2021' ||
                  err?.code === 'P2022' ||
                  err?.message?.includes("Can't reach database") ||
                  err?.message?.includes('ECONNREFUSED') ||
                  err?.message?.includes("doesn't exist") ||
                  err?.message?.includes('does not exist')
                ) {
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

export default prisma;
