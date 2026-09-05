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
}
