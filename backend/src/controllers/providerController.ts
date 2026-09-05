import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ImageProcessingService } from '../services/image/ImageProcessingService';
import { GoogleDriveStorageService } from '../services/storage/GoogleDriveStorageService';
import { AuditService } from '../services/audit/AuditService';

const storageService = new GoogleDriveStorageService();

function matchesCategory(providerCategory: string, category: { name: string; slug: string }): boolean {
  const pCat = providerCategory.toLowerCase().trim();
  const cName = category.name.toLowerCase().trim();
  const cSlug = category.slug.toLowerCase().trim();

  if (pCat === 'all' || pCat.includes('all')) return true;
  if (pCat.includes('food') || pCat.includes('meal')) return cSlug === 'food' || cName.includes('food');
  if (pCat.includes('fruit')) return cSlug === 'fruits' || cName.includes('fruit');
  if (pCat.includes('laundry')) return cSlug === 'laundry' || cName.includes('laundry');
  if (pCat.includes('essential') || pCat.includes('stationery')) return cSlug === 'essentials' || cName.includes('essential') || cName.includes('stationery');
  return cSlug === pCat || cName === pCat;
}

export class ProviderController {
  /**
   * Section 7: Service Provider Individual Dashboard
   */
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = req.user?.providerId;
      if (!providerId) {
        res.status(403).json({ success: false, message: 'Provider profile required' });
        return;
      }

      const provider = await prisma.serviceProvider.findUnique({
        where: { id: providerId },
        include: { user: true }
      });

      if (!provider) {
        res.status(404).json({ success: false, message: 'Provider profile not found.' });
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [products, orders, laundryJobs] = await Promise.all([
        prisma.product.findMany({
          where: { providerId },
          include: { category: true, images: true, inventory: true },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.order.findMany({
          where: { providerId },
          include: {
            student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
            items: true,
            deliveryBoy: { select: { id: true, fullName: true, mobileNumber: true } }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.laundryOrder.findMany({
          where: { providerId },
          include: {
            student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
            items: true,
            deliveryBoy: { select: { id: true, fullName: true, mobileNumber: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
      const totalSales = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const todaySales = deliveredOrders
        .filter((o) => new Date(o.createdAt) >= todayStart)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const monthlySales = deliveredOrders
        .filter((o) => new Date(o.createdAt) >= monthStart)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);

      res.status(200).json({
        success: true,
        provider: {
          id: provider.id,
          fullName: provider.fullName,
          serviceCategory: provider.serviceCategory,
          email: provider.user?.email,
          mobileNumber: provider.mobileNumber,
          activeStatus: provider.activeStatus
        },
        stats: {
          totalProducts: products.length,
          availableProducts: products.filter((p) => p.availability && p.approvalStatus === 'APPROVED' && p.stock > 0).length,
          outOfStockProducts: products.filter((p) => p.stock <= 0).length,
          pendingApprovals: products.filter((p) => p.approvalStatus === 'PENDING').length,
          rejectedProducts: products.filter((p) => p.approvalStatus === 'REJECTED').length,
          totalOrders: orders.length,
          pendingOrders: orders.filter((o) => ['CONFIRMED', 'ACCEPTED'].includes(o.status)).length,
          processingOrders: orders.filter((o) => o.status === 'PREPARING').length,
          readyOrders: orders.filter((o) => ['READY', 'READY_FOR_PICKUP'].includes(o.status)).length,
          completedOrders: deliveredOrders.length,
          cancelledOrders: orders.filter((o) => o.status === 'CANCELLED').length,
          totalSales,
          todaySales,
          monthlySales,
          activeLaundryCount: laundryJobs.filter((l) => l.status !== 'COMPLETED' && l.status !== 'CANCELLED').length
        },
        recentOrders: orders.slice(0, 10).map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount)
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 8: Provider Product Listing (Own products with approval status)
   */
  public static async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = req.user?.providerId;
      if (!providerId) {
        res.status(403).json({ success: false, message: 'Provider profile required' });
        return;
      }

      const products = await prisma.product.findMany({
        where: { providerId },
        include: {
          category: true,
          images: true,
          inventory: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        products: products.map((p) => ({
          ...p,
          price: Number(p.price),
          discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
          isLowStock: p.stock <= (p.lowStockThreshold || 5) && p.stock > 0,
          isOutOfStock: p.stock <= 0
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 8, 9 & 12: Provider Add Product with Category Restriction & Pending Approval
   */
  public static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = req.user?.providerId;
      if (!providerId) {
        res.status(403).json({ success: false, message: 'Provider profile required' });
        return;
      }

      const provider = await prisma.serviceProvider.findUnique({ where: { id: providerId } });
      if (!provider) {
        res.status(404).json({ success: false, message: 'Provider profile not found.' });
        return;
      }

      const {
        name,
        slug,
        categoryId,
        description,
        price,
        discountPrice,
        unit = 'piece',
        stock = 20,
        lowStockThreshold = 5,
        availableToday = true
      } = req.body;

      if (!name || !categoryId || !price) {
        res.status(400).json({ success: false, message: 'Product name, category, and price are required.' });
        return;
      }

      // Strict Category Restriction Enforcement (Section 12)
      const targetCategory = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!targetCategory) {
        res.status(404).json({ success: false, message: 'Specified category not found.' });
        return;
      }

      if (!matchesCategory(provider.serviceCategory, targetCategory)) {
        res.status(403).json({
          success: false,
          message: `Category restriction: You are assigned to "${provider.serviceCategory}". You are not authorized to add products under "${targetCategory.name}".`
        });
        return;
      }

      const productSlug = (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

      // Status is strictly PENDING until Admin approves (Section 9)
      const product = await prisma.product.create({
        data: {
          name,
          slug: productSlug,
          categoryId: targetCategory.id,
          description,
          price: parseFloat(price),
          discountPrice: discountPrice ? parseFloat(discountPrice) : null,
          unit,
          stock: parseInt(stock, 10) || 0,
          lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
          availability: true,
          availableToday: availableToday === 'true' || availableToday === true,
          providerId,
          approvalStatus: 'PENDING',
          inventory: {
            create: {
              currentStock: parseInt(stock, 10) || 0,
              lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
              isOutOfStock: (parseInt(stock, 10) || 0) <= 0
            }
          }
        }
      });

      // Handle Image Upload if provided
      const file = req.file;
      if (file) {
        try {
          const processed = await ImageProcessingService.normalizeProductImage(file.buffer);
          const uploadResult = await storageService.uploadFile(
            processed.buffer,
            `${productSlug}.jpg`,
            processed.mimeType,
            'General'
          );

          await prisma.productImage.create({
            data: {
              productId: product.id,
              googleDriveFileId: uploadResult.fileId,
              googleDriveUrl: uploadResult.webUrl,
              fileName: uploadResult.fileName,
              mimeType: uploadResult.mimeType,
              fileSize: processed.size,
              isPrimary: true,
              uploadedBy: req.user?.email || 'PROVIDER'
            }
          });
        } catch (imgErr) {
          console.warn('Provider image upload notice:', imgErr);
        }
      }

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'PROVIDER_PRODUCT_SUBMITTED',
        entity: 'Product',
        entityId: product.id,
        newValue: { name, category: targetCategory.name, providerId }
      });

      res.status(201).json({
        success: true,
        message: 'Product submitted successfully! It is now Pending Approval by campus administration.',
        product
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Provider Edit Own Product (Price, Stock, Availability)
   */
  public static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const providerId = req.user?.providerId;
      const { price, discountPrice, stock, availability } = req.body;

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found.' });
        return;
      }

      if (product.providerId !== providerId) {
        res.status(403).json({ success: false, message: 'You can only manage your own products.' });
        return;
      }

      const updated = await prisma.product.update({
        where: { id },
        data: {
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(discountPrice !== undefined && { discountPrice: discountPrice ? parseFloat(discountPrice) : null }),
          ...(stock !== undefined && { stock: parseInt(stock, 10) }),
          ...(availability !== undefined && { availability: availability === true || availability === 'true' })
        }
      });

      if (stock !== undefined) {
        await prisma.inventory.upsert({
          where: { productId: id },
          update: {
            currentStock: parseInt(stock, 10),
            isOutOfStock: parseInt(stock, 10) <= 0
          },
          create: {
            productId: id,
            currentStock: parseInt(stock, 10),
            isOutOfStock: parseInt(stock, 10) <= 0
          }
        });
      }

      res.status(200).json({ success: true, message: 'Product updated successfully.', product: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 13: Service Provider Orders
   */
  public static async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = req.user?.providerId;
      if (!providerId) {
        res.status(403).json({ success: false, message: 'Provider profile required' });
        return;
      }

      const orders = await prisma.order.findMany({
        where: { providerId },
        include: {
          student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
          items: true,
          deliveryBoy: { select: { id: true, fullName: true, mobileNumber: true, vehicleType: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        orders: orders.map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount)
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 13: Update Permitted Order Status
   */
  public static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const providerId = req.user?.providerId;

      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      if (order.providerId && order.providerId !== providerId) {
        res.status(403).json({ success: false, message: 'You are not assigned to this order' });
        return;
      }

      const allowedStatuses = ['PREPARING', 'READY', 'READY_FOR_PICKUP'];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Service providers can only update status to Preparing or Ready for Pickup.`
        });
        return;
      }

      await prisma.order.update({
        where: { id },
        data: {
          status,
          providerId: order.providerId || providerId,
          statusHistory: {
            create: {
              previousStatus: order.status,
              newStatus: status,
              changedBy: req.user?.email || 'PROVIDER',
              notes: notes || `Provider updated status to ${status}`
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Enterprise Analytics Console: Power BI / Shopify Analytics grade reporting
   */
  public static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let providerId = req.user?.providerId;
      if (req.user?.role === 'SERVICE_PROVIDER') {
        if (!providerId && req.user?.userId) {
          const prov = await prisma.serviceProvider.findUnique({ where: { userId: req.user.userId } });
          if (prov) providerId = prov.id;
        }
      } else if (req.user?.role === 'ADMIN' && req.query.providerId) {
        providerId = String(req.query.providerId);
      }

      if (!providerId) {
        res.status(403).json({ success: false, message: 'Provider profile required' });
        return;
      }

      const provider = await prisma.serviceProvider.findUnique({
        where: { id: providerId },
        include: { user: true }
      });

      if (!provider) {
        res.status(404).json({ success: false, message: 'Provider profile not found.' });
        return;
      }

      const timeframe = (req.query.timeframe as string) || '30d';
      const customStart = req.query.startDate as string;
      const customEnd = req.query.endDate as string;

      // 1. Fetch all provider orders & products
      const [allOrdersRaw, allProductsRaw] = await Promise.all([
        prisma.order.findMany({
          where: { providerId },
          include: {
            student: { include: { hall: true } },
            items: true,
            deliveryBoy: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.findMany({
          where: { providerId },
          include: { category: true, inventory: true },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const allOrders: any[] = allOrdersRaw as any[];
      const allProducts: any[] = allProductsRaw as any[];

      const now = new Date();

      // Helper function for percentage comparisons
      const calcComparison = (currentVal: number, prevVal: number) => {
        if (prevVal === 0) {
          return { percent: currentVal > 0 ? 100 : 0, trend: currentVal > 0 ? 'up' : 'neutral' };
        }
        const diff = currentVal - prevVal;
        const pct = Math.round(((diff / prevVal) * 100) * 10) / 10;
        return {
          percent: Math.abs(pct),
          trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral'
        };
      };

      // Define time boundary dates
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Order status buckets
      const completedOrders = allOrders.filter((o) => o.status === 'DELIVERED');
      const activeOrders = allOrders.filter((o) =>
        ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)
      );

      // 10 KPI Computations
      // 1. Today's Sales
      const todaySales = completedOrders
        .filter((o) => new Date(o.createdAt) >= startOfToday)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const yesterdaySales = completedOrders
        .filter((o) => new Date(o.createdAt) >= startOfYesterday && new Date(o.createdAt) <= endOfYesterday)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const todayComp = calcComparison(todaySales, yesterdaySales);

      // 2. This Week's Sales
      const thisWeekSales = completedOrders
        .filter((o) => new Date(o.createdAt) >= sevenDaysAgo)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const lastWeekSales = completedOrders
        .filter((o) => new Date(o.createdAt) >= fourteenDaysAgo && new Date(o.createdAt) < sevenDaysAgo)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const weekComp = calcComparison(thisWeekSales, lastWeekSales);

      // 3. This Month's Sales
      const thisMonthSales = completedOrders
        .filter((o) => new Date(o.createdAt) >= startOfThisMonth)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const lastMonthSales = completedOrders
        .filter((o) => new Date(o.createdAt) >= startOfLastMonth && new Date(o.createdAt) <= endOfLastMonth)
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const monthComp = calcComparison(thisMonthSales, lastMonthSales);

      // 4. Total Sales
      const totalSales = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

      // 5. Total Orders
      const totalOrdersCount = allOrders.length;
      const recentOrdersCount = allOrders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo).length;
      const priorOrdersCount = allOrders.filter((o) => new Date(o.createdAt) >= fourteenDaysAgo && new Date(o.createdAt) < sevenDaysAgo).length;
      const ordersComp = calcComparison(recentOrdersCount, priorOrdersCount);

      // 6. Completed Orders
      const completedOrdersCount = completedOrders.length;
      const completionRate = totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;

      // 7. Active Orders
      const activeOrdersCount = activeOrders.length;
      const preparingCount = allOrders.filter((o) => o.status === 'PREPARING').length;
      const readyCount = allOrders.filter((o) => ['READY', 'READY_FOR_PICKUP'].includes(o.status)).length;
      const outForDeliveryCount = allOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;

      // 8, 9, 10. Products KPIs
      const totalProductsCount = allProducts.length;
      const availableProductsCount = allProducts.filter((p) => p.availability && p.approvalStatus === 'APPROVED' && p.stock > 0).length;
      const outOfStockProductsCount = allProducts.filter((p) => p.stock <= 0).length;
      const lowStockProductsCount = allProducts.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length;

      // -------------------------------------------------------------
      // Dynamic Sales Trend Chart (7d, 30d, 90d, 6m, 1y, custom)
      // -------------------------------------------------------------
      let rangeDays = 30;
      if (timeframe === '7d' || timeframe === 'last_7_days') rangeDays = 7;
      else if (timeframe === '30d' || timeframe === 'last_30_days') rangeDays = 30;
      else if (timeframe === '90d' || timeframe === 'last_3_months') rangeDays = 90;
      else if (timeframe === '6m' || timeframe === 'last_6_months') rangeDays = 180;
      else if (timeframe === '1y' || timeframe === 'this_year') rangeDays = 365;
      else if (timeframe === 'today') rangeDays = 1;
      else if (timeframe === 'yesterday') rangeDays = 2;

      // Build daily map for range
      const dailyMap: Record<string, { date: string; rawDate: string; sales: number; orders: number; itemsSold: number }> = {};
      const startDate = customStart ? new Date(customStart) : new Date(now.getTime() - (rangeDays - 1) * 24 * 60 * 60 * 1000);
      const endDate = customEnd ? new Date(customEnd) : now;

      // Pre-populate days
      const loopDate = new Date(startDate);
      loopDate.setHours(0, 0, 0, 0);
      while (loopDate <= endDate) {
        const key = loopDate.toISOString().slice(0, 10);
        const dayLabel = loopDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        dailyMap[key] = { date: dayLabel, rawDate: key, sales: 0, orders: 0, itemsSold: 0 };
        loopDate.setDate(loopDate.getDate() + 1);
      }

      // Aggregate all provider orders into daily buckets
      allOrders.forEach((ord) => {
        const ordDate = new Date(ord.createdAt);
        const key = ordDate.toISOString().slice(0, 10);
        if (dailyMap[key]) {
          dailyMap[key].orders += 1;
          if (ord.status === 'DELIVERED') {
            dailyMap[key].sales += Number(ord.totalAmount);
          }
          const itemsCount = ord.items ? ord.items.reduce((s: number, it: any) => s + (it.quantity || 1), 0) : 1;
          dailyMap[key].itemsSold += itemsCount;
        }
      });

      const salesTrends = Object.values(dailyMap);

      // -------------------------------------------------------------
      // Monthly Sales Chart (Jan - Dec)
      // -------------------------------------------------------------
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlySales = monthNames.map((m, idx) => ({
        month: m,
        monthIndex: idx,
        sales: 0,
        orders: 0,
        itemsSold: 0
      }));

      const currentYear = now.getFullYear();
      allOrders.forEach((ord) => {
        const oDate = new Date(ord.createdAt);
        if (oDate.getFullYear() === currentYear) {
          const mIdx = oDate.getMonth();
          monthlySales[mIdx].orders += 1;
          if (ord.status === 'DELIVERED') {
            monthlySales[mIdx].sales += Number(ord.totalAmount);
          }
          const itemsCount = ord.items ? ord.items.reduce((s: number, it: any) => s + (it.quantity || 1), 0) : 1;
          monthlySales[mIdx].itemsSold += itemsCount;
        }
      });

      // -------------------------------------------------------------
      // Customer Analytics & "Top Customers" Leaderboard
      // -------------------------------------------------------------
      const customerMap: Record<
        string,
        {
          id: string;
          name: string;
          email: string;
          hall: string;
          room: string;
          totalOrders: number;
          itemsPurchased: number;
          grossSales: number;
          discount: number;
          netSales: number;
          lastPurchaseDate: Date;
          lastPurchase: string;
        }
      > = {};

      allOrders.forEach((ord) => {
        const cId = ord.studentId || ord.student?.id || ord.orderNumber;
        const cName = ord.student?.fullName || 'Campus Student';
        const cEmail = ord.student?.email || 'student@nitdgp.ac.in';
        const cHall = ord.student?.hallName || ord.hallName || 'NIT Hostel';
        const cRoom = ord.student?.roomNumber || ord.roomNumber || 'Room';
        const itemsCount = ord.items ? ord.items.reduce((s: number, it: any) => s + (it.quantity || 1), 0) : 1;
        const ordGross = Number(ord.subtotal || ord.totalAmount || 0);
        const ordDisc = Number(ord.discountAmount || 0);
        const ordNet = Number(ord.totalAmount || 0);
        const ordDate = new Date(ord.createdAt);

        if (!customerMap[cId]) {
          customerMap[cId] = {
            id: cId,
            name: cName,
            email: cEmail,
            hall: cHall,
            room: cRoom,
            totalOrders: 0,
            itemsPurchased: 0,
            grossSales: 0,
            discount: 0,
            netSales: 0,
            lastPurchaseDate: ordDate,
            lastPurchase: ordDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          };
        }

        customerMap[cId].totalOrders += 1;
        customerMap[cId].itemsPurchased += itemsCount;
        customerMap[cId].grossSales += ordGross;
        customerMap[cId].discount += ordDisc;
        if (ord.status === 'DELIVERED') {
          customerMap[cId].netSales += ordNet;
        }
        if (ordDate > customerMap[cId].lastPurchaseDate) {
          customerMap[cId].lastPurchaseDate = ordDate;
          customerMap[cId].lastPurchase = ordDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      });

      const customerList = Object.values(customerMap).map((c) => {
        const aov = c.totalOrders > 0 ? Math.round(c.netSales / c.totalOrders) : 0;
        const daysSinceLast = Math.round((now.getTime() - c.lastPurchaseDate.getTime()) / (24 * 60 * 60 * 1000));
        return {
          ...c,
          averageOrderValue: aov,
          status: daysSinceLast <= 30 ? ('Active' as const) : ('Inactive' as const)
        };
      });

      // Sort customers by net sales descending
      customerList.sort((a, b) => b.netSales - a.netSales || b.totalOrders - a.totalOrders);

      // Top Customers Leaderboard
      const topCustomers = customerList.slice(0, 10).map((c, idx) => ({
        rank: idx + 1,
        id: c.id,
        name: c.name,
        email: c.email,
        hall: c.hall,
        room: c.room,
        totalOrders: c.totalOrders,
        totalSpent: c.netSales,
        averageOrderValue: c.averageOrderValue,
        lastOrderDate: c.lastPurchase
      }));

      const totalCustomersCount = customerList.length;
      const activeCustomersCount = customerList.filter((c) => c.status === 'Active').length;
      const returningCustomersCount = customerList.filter((c) => c.totalOrders > 1).length;
      const repeatPurchaseRate = totalCustomersCount > 0 ? Math.round((returningCustomersCount / totalCustomersCount) * 100) : 0;
      const overallAov = totalOrdersCount > 0 ? Math.round(totalSales / (completedOrdersCount || 1)) : 0;

      // -------------------------------------------------------------
      // Product Performance Analytics
      // -------------------------------------------------------------
      const productSalesMap: Record<string, { unitsSold: number; ordersCount: number; revenue: number }> = {};
      allOrders.forEach((ord) => {
        if (ord.items) {
          ord.items.forEach((item: any) => {
            const pId = item.productId || item.productName;
            if (!productSalesMap[pId]) {
              productSalesMap[pId] = { unitsSold: 0, ordersCount: 0, revenue: 0 };
            }
            productSalesMap[pId].ordersCount += 1;
            const q = item.quantity || 1;
            productSalesMap[pId].unitsSold += q;
            if (ord.status === 'DELIVERED') {
              productSalesMap[pId].revenue += Number(item.totalPrice || item.unitPrice * q || 0);
            }
          });
        }
      });

      const productPerformance = allProducts.map((p) => {
        const stats = productSalesMap[p.id] || productSalesMap[p.name] || { unitsSold: 0, ordersCount: 0, revenue: 0 };
        return {
          id: p.id,
          name: p.name,
          category: p.category?.name || 'General',
          price: Number(p.price),
          unitsSold: stats.unitsSold,
          ordersCount: stats.ordersCount,
          revenue: stats.revenue,
          currentStock: p.stock,
          lowStockThreshold: p.lowStockThreshold || 5,
          status: p.approvalStatus || 'APPROVED',
          isLowStock: p.stock > 0 && p.stock <= (p.lowStockThreshold || 5),
          isOutOfStock: p.stock <= 0
        };
      });

      const topSellingProducts = [...productPerformance].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10);
      const topRevenueProducts = [...productPerformance].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
      const lowStockProducts = productPerformance.filter((p) => p.isLowStock);
      const outOfStockProducts = productPerformance.filter((p) => p.isOutOfStock);
      const pendingApprovalProducts = productPerformance.filter((p) => p.status === 'PENDING');

      // -------------------------------------------------------------
      // Order Status Breakdown & Distribution
      // -------------------------------------------------------------
      const statusCounts: Record<string, number> = {
        PENDING: 0,
        ACCEPTED: 0,
        PREPARING: 0,
        READY_FOR_PICKUP: 0,
        OUT_FOR_DELIVERY: 0,
        DELIVERED: 0,
        CANCELLED: 0
      };

      allOrders.forEach((o) => {
        const s = o.status;
        if (['CONFIRMED', 'PENDING'].includes(s)) statusCounts.PENDING += 1;
        else if (s === 'ACCEPTED') statusCounts.ACCEPTED += 1;
        else if (s === 'PREPARING') statusCounts.PREPARING += 1;
        else if (['READY', 'READY_FOR_PICKUP'].includes(s)) statusCounts.READY_FOR_PICKUP += 1;
        else if (s === 'OUT_FOR_DELIVERY') statusCounts.OUT_FOR_DELIVERY += 1;
        else if (s === 'DELIVERED') statusCounts.DELIVERED += 1;
        else if (s === 'CANCELLED') statusCounts.CANCELLED += 1;
      });

      const statusPercentages: Record<string, number> = {};
      Object.keys(statusCounts).forEach((k) => {
        statusPercentages[k] = totalOrdersCount > 0 ? Math.round((statusCounts[k] / totalOrdersCount) * 100) : 0;
      });

      // -------------------------------------------------------------
      // Live Operations Board
      // -------------------------------------------------------------
      const liveOperations = activeOrders.slice(0, 15).map((o) => {
        const itemsFormatted = o.items ? o.items.map((i: any) => `${i.productName || 'Item'} × ${i.quantity || 1}`).join(', ') : 'Order items';
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.student?.fullName || 'Student',
          customerMobile: o.student?.mobileNumber || '',
          hallName: o.student?.hallName || o.hallName || 'Hostel',
          roomNumber: o.student?.roomNumber || o.roomNumber || '',
          itemsSummary: itemsFormatted,
          totalAmount: Number(o.totalAmount),
          status: o.status,
          deliveryBoyName: o.deliveryBoy?.fullName || 'Not assigned yet',
          deliveryBoyMobile: o.deliveryBoy?.mobileNumber || '',
          createdAt: o.createdAt
        };
      });

      // -------------------------------------------------------------
      // Delivery Performance & Assigned Runners
      // -------------------------------------------------------------
      const runnerMap: Record<
        string,
        { id: string; name: string; mobile: string; vehicleType: string; totalAssigned: number; completed: number }
      > = {};

      allOrders.forEach((o) => {
        if (o.deliveryBoy) {
          const rId = o.deliveryBoy.id;
          if (!runnerMap[rId]) {
            runnerMap[rId] = {
              id: rId,
              name: o.deliveryBoy.fullName,
              mobile: o.deliveryBoy.mobileNumber || '',
              vehicleType: o.deliveryBoy.vehicleType || 'Delivery Runner',
              totalAssigned: 0,
              completed: 0
            };
          }
          runnerMap[rId].totalAssigned += 1;
          if (o.status === 'DELIVERED') {
            runnerMap[rId].completed += 1;
          }
        }
      });

      const runners = Object.values(runnerMap).map((r) => ({
        ...r,
        completionRate: r.totalAssigned > 0 ? Math.round((r.completed / r.totalAssigned) * 100) : 100
      }));

      const deliveryDeliveredToday = completedOrders.filter((o) => new Date(o.createdAt) >= startOfToday).length;

      // -------------------------------------------------------------
      // Revenue Breakdown & Payment / Settlement Analytics
      // -------------------------------------------------------------
      const grossSales = allOrders.reduce((sum, o) => sum + Number(o.subtotal || o.totalAmount), 0);
      const totalDiscounts = allOrders.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);
      const totalRefunds = allOrders.filter((o) => o.status === 'CANCELLED').reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const netSales = totalSales;
      const finalEarnings = netSales; // As per instructions: no invented fees

      const paidOrders = allOrders.filter((o) => o.paymentStatus === 'SUCCESS' || o.paymentMethod === 'RAZORPAY');
      const unpaidOrders = allOrders.filter((o) => o.paymentStatus !== 'SUCCESS' && o.paymentMethod !== 'RAZORPAY');

      // -------------------------------------------------------------
      // Automated Real Business Insights
      // -------------------------------------------------------------
      const businessInsights: string[] = [];

      // 1. Top product revenue share
      if (topRevenueProducts.length > 0 && totalSales > 0) {
        const topProd = topRevenueProducts[0];
        const share = Math.round((topProd.revenue / totalSales) * 100);
        if (share > 0) {
          businessInsights.push(`${topProd.name} generated ${share}% of your total revenue.`);
        }
      }

      // 2. Month-over-month growth
      if (lastMonthSales > 0) {
        const growth = Math.round(((thisMonthSales - lastMonthSales) / lastMonthSales) * 100);
        if (growth > 0) {
          businessInsights.push(`Your sales increased ${growth}% compared with last month.`);
        } else if (growth < 0) {
          businessInsights.push(`Sales are ${Math.abs(growth)}% lower than last month.`);
        }
      } else if (thisMonthSales > 0) {
        businessInsights.push(`Generated ₹${thisMonthSales.toLocaleString('en-IN')} in sales this month.`);
      }

      // 3. Highest value customer
      if (topCustomers.length > 0 && topCustomers[0].totalSpent > 0) {
        businessInsights.push(`${topCustomers[0].name} is your highest-value customer with ₹${topCustomers[0].totalSpent.toLocaleString('en-IN')} spent.`);
      }

      // 4. Low stock notice
      if (lowStockProductsCount > 0) {
        businessInsights.push(`${lowStockProductsCount} product${lowStockProductsCount > 1 ? 's are' : ' is'} currently running low in stock.`);
      }

      // 5. Peak day of week
      const daySalesMap: Record<string, number> = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      allOrders.forEach((o) => {
        if (o.status === 'DELIVERED') {
          const dName = dayNames[new Date(o.createdAt).getDay()];
          daySalesMap[dName] += Number(o.totalAmount);
        }
      });
      const topDay = Object.entries(daySalesMap).sort((a, b) => b[1] - a[1])[0];
      if (topDay && topDay[1] > 0) {
        businessInsights.push(`${topDay[0]}s generate your highest cumulative sales volume.`);
      }

      // Return comprehensive enterprise business console response
      res.status(200).json({
        success: true,
        provider: {
          id: provider.id,
          fullName: provider.fullName,
          serviceCategory: provider.serviceCategory,
          email: provider.user?.email || provider.user?.personalEmail || 'vendor@nitdgp.ac.in',
          username: provider.user?.username || provider.id,
          accountStatus: provider.activeStatus ? 'Active' : 'Inactive'
        },
        timeframe,
        kpiCards: {
          todaySales: {
            value: todaySales,
            comparisonValue: yesterdaySales,
            percentChange: todayComp.percent,
            trend: todayComp.trend,
            subtitle: 'vs yesterday'
          },
          thisWeekSales: {
            value: thisWeekSales,
            comparisonValue: lastWeekSales,
            percentChange: weekComp.percent,
            trend: weekComp.trend,
            subtitle: 'vs last week'
          },
          thisMonthSales: {
            value: thisMonthSales,
            comparisonValue: lastMonthSales,
            percentChange: monthComp.percent,
            trend: monthComp.trend,
            subtitle: 'vs last month'
          },
          totalSales: {
            value: totalSales,
            subtitle: 'All-time gross volume'
          },
          totalOrders: {
            value: totalOrdersCount,
            percentChange: ordersComp.percent,
            trend: ordersComp.trend,
            subtitle: 'vs prior 7 days'
          },
          completedOrders: {
            value: completedOrdersCount,
            rate: completionRate,
            subtitle: `${completionRate}% fulfillment rate`
          },
          activeOrders: {
            value: activeOrdersCount,
            preparingCount,
            readyCount,
            outForDeliveryCount,
            subtitle: `${preparingCount} currently being prepared`
          },
          totalProducts: {
            value: totalProductsCount,
            subtitle: 'Catalog items'
          },
          availableProducts: {
            value: availableProductsCount,
            subtitle: 'Live & approved'
          },
          outOfStockProducts: {
            value: outOfStockProductsCount,
            subtitle: 'Needs restocking'
          }
        },
        salesTrends,
        monthlySales,
        customerAnalytics: {
          totalCustomers: totalCustomersCount,
          activeCustomers: activeCustomersCount,
          returningCustomers: returningCustomersCount,
          repeatPurchaseRate,
          averageOrderValue: overallAov,
          topCustomers,
          customerList
        },
        productPerformance: {
          products: productPerformance,
          topSelling: topSellingProducts,
          topRevenue: topRevenueProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          pendingApproval: pendingApprovalProducts
        },
        orderPerformance: {
          totalOrders: totalOrdersCount,
          statusCounts,
          statusPercentages
        },
        liveOperations,
        deliveryPerformance: {
          awaitingPickup: readyCount,
          pickedUp: outForDeliveryCount,
          outForDelivery: outForDeliveryCount,
          deliveredToday: deliveryDeliveredToday,
          deliveryCompletionRate: completionRate,
          runners
        },
        revenueBreakdown: {
          grossSales,
          discounts: totalDiscounts,
          refunds: totalRefunds,
          netSales,
          platformFees: 0,
          finalEarnings
        },
        paymentAnalytics: {
          totalEarned: finalEarnings,
          pendingSettlement: activeOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
          settledAmount: finalEarnings,
          refundAmount: totalRefunds,
          paidOrdersCount: paidOrders.length,
          unpaidOrdersCount: unpaidOrders.length
        },
        businessInsights
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Section 18: Export Provider Business Data to CSV
   */
  public static async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let providerId = req.user?.providerId;
      if (req.user?.role === 'SERVICE_PROVIDER') {
        if (!providerId && req.user?.userId) {
          const prov = await prisma.serviceProvider.findUnique({ where: { userId: req.user.userId } });
          if (prov) providerId = prov.id;
        }
      } else if (req.user?.role === 'ADMIN' && req.query.providerId) {
        providerId = String(req.query.providerId);
      }

      if (!providerId) {
        res.status(403).json({ success: false, message: 'Provider profile required' });
        return;
      }

      const type = (req.query.type as string) || 'orders';
      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      if (type === 'customers') {
        const orders: any[] = (await prisma.order.findMany({
          where: { providerId },
          include: { student: { include: { hall: true } } }
        })) as any[];

        const customerMap: Record<string, any> = {};
        orders.forEach((o) => {
          const cId = o.studentId || o.orderNumber;
          if (!customerMap[cId]) {
            customerMap[cId] = {
              name: o.student?.fullName || 'Student',
              hall: o.student?.hall?.name || o.student?.hallName || o.hallName || 'Hostel',
              room: o.student?.roomNumber || o.roomNumber || '',
              orders: 0,
              spent: 0,
              lastDate: o.createdAt
            };
          }
          customerMap[cId].orders += 1;
          if (o.status === 'DELIVERED') customerMap[cId].spent += Number(o.totalAmount);
          if (new Date(o.createdAt) > new Date(customerMap[cId].lastDate)) {
            customerMap[cId].lastDate = o.createdAt;
          }
        });

        const header = 'Customer Name,Hostel Hall,Room Number,Total Orders,Total Spent (INR),Average Order (INR),Last Order Date\n';
        const rows = Object.values(customerMap).map((c) => {
          const aov = c.orders > 0 ? Math.round(c.spent / c.orders) : 0;
          return [
            escapeCsv(c.name),
            escapeCsv(c.hall),
            escapeCsv(c.room),
            c.orders,
            c.spent,
            aov,
            escapeCsv(new Date(c.lastDate).toISOString().slice(0, 10))
          ].join(',');
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="customers_report.csv"');
        res.send(header + rows.join('\n'));
        return;
      }

      if (type === 'products') {
        const products: any[] = (await prisma.product.findMany({
          where: { providerId },
          include: { category: true }
        })) as any[];

        const header = 'Product Name,Category,Price (INR),Current Stock,Low Stock Threshold,Approval Status\n';
        const rows = products.map((p) =>
          [
            escapeCsv(p.name),
            escapeCsv(p.category?.name || 'General'),
            p.price,
            p.stock,
            p.lowStockThreshold || 5,
            escapeCsv(p.approvalStatus || 'APPROVED')
          ].join(',')
        );

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="products_catalog.csv"');
        res.send(header + rows.join('\n'));
        return;
      }

      if (type === 'sales') {
        const orders: any[] = (await prisma.order.findMany({
          where: { providerId },
          include: { items: true },
          orderBy: { createdAt: 'desc' }
        })) as any[];

        const dailyMap: Record<string, { date: string; sales: number; orders: number; items: number }> = {};
        orders.forEach((o) => {
          const dKey = new Date(o.createdAt).toISOString().slice(0, 10);
          if (!dailyMap[dKey]) dailyMap[dKey] = { date: dKey, sales: 0, orders: 0, items: 0 };
          dailyMap[dKey].orders += 1;
          if (o.status === 'DELIVERED') dailyMap[dKey].sales += Number(o.totalAmount);
          const q = o.items ? o.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 1;
          dailyMap[dKey].items += q;
        });

        const header = 'Date,Daily Sales (INR),Orders Placed,Items Sold\n';
        const rows = Object.values(dailyMap)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((d) => [escapeCsv(d.date), d.sales, d.orders, d.items].join(','));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_trend_report.csv"');
        res.send(header + rows.join('\n'));
        return;
      }

      // Default: orders export
      const orders: any[] = (await prisma.order.findMany({
        where: { providerId },
        include: { student: { include: { hall: true } }, items: true, deliveryBoy: true },
        orderBy: { createdAt: 'desc' }
      })) as any[];

      const header = 'Order Number,Date,Customer Name,Hostel,Room,Items,Total Amount (INR),Status,Payment Method,Delivery Runner\n';
      const rows = orders.map((o) => {
        const itemsStr = o.items ? o.items.map((i: any) => `${i.productName || 'Item'} (x${i.quantity || 1})`).join('; ') : '';
        return [
          escapeCsv(o.orderNumber),
          escapeCsv(new Date(o.createdAt).toISOString().slice(0, 19)),
          escapeCsv(o.student?.fullName || 'Student'),
          escapeCsv(o.student?.hallName || o.hallName || ''),
          escapeCsv(o.student?.roomNumber || o.roomNumber || ''),
          escapeCsv(itemsStr),
          o.totalAmount,
          escapeCsv(o.status),
          escapeCsv(o.paymentMethod || 'COD'),
          escapeCsv(o.deliveryBoy?.fullName || 'Unassigned')
        ].join(',');
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="orders_report.csv"');
      res.send(header + rows.join('\n'));
    } catch (err) {
      next(err);
    }
  }
}
