import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditService } from '../services/audit/AuditService';

export class AdminLaundryController {
  /**
   * Get all laundry providers and their service rate cards
   */
  public static async getProvidersAndServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = await prisma.serviceProvider.findMany({
        where: { serviceCategory: 'LAUNDRY' },
        include: { user: { select: { email: true, id: true } } }
      });

      const serviceConfigs = await prisma.laundryServiceConfig.findMany({
        orderBy: { createdAt: 'asc' }
      });

      res.status(200).json({
        success: true,
        providers,
        serviceConfigs
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create or update a specific laundry service configuration
   */
  public static async upsertPricingConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        id,
        providerId,
        serviceName,
        pricingUnit,
        unitDisplayName,
        providerPricePerUnit,
        serviceChargePerUnit,
        minQuantity,
        maxQuantity,
        turnaroundHours,
        isAvailable,
        itemRatesJson,
        tariffHeroTitle,
        tariffHeroSubtitle,
        tariffTag,
        tariffBadge
      } = req.body;

      if (!serviceName) {
        res.status(400).json({ success: false, message: 'Service name is required.' });
        return;
      }

      let config: any;
      if (id) {
        config = await prisma.laundryServiceConfig.update({
          where: { id },
          data: {
            providerId: providerId || null,
            serviceName,
            pricingUnit: pricingUnit || 'per_dress',
            unitDisplayName: unitDisplayName || 'per garment',
            providerPricePerUnit: Number(providerPricePerUnit || 15),
            serviceChargePerUnit: Number(serviceChargePerUnit || 1),
            minQuantity: Number(minQuantity || 1),
            maxQuantity: maxQuantity ? Number(maxQuantity) : null,
            turnaroundHours: Number(turnaroundHours || 24),
            isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
            itemRatesJson: typeof itemRatesJson === 'object' ? JSON.stringify(itemRatesJson) : itemRatesJson,
            tariffHeroTitle: tariffHeroTitle || 'Express Campus Laundry',
            tariffHeroSubtitle: tariffHeroSubtitle || 'Automated wash, fabric softening & steam iron with room-to-room pickup across Halls 1–14',
            tariffTag: tariffTag || 'DUAL-OTP',
            tariffBadge: tariffBadge || 'SUBSIDIZED TARIFF'
          }
        });
      } else {
        config = await prisma.laundryServiceConfig.create({
          data: {
            providerId: providerId || null,
            serviceName,
            pricingUnit: pricingUnit || 'per_dress',
            unitDisplayName: unitDisplayName || 'per garment',
            providerPricePerUnit: Number(providerPricePerUnit || 15),
            serviceChargePerUnit: Number(serviceChargePerUnit || 1),
            minQuantity: Number(minQuantity || 1),
            maxQuantity: maxQuantity ? Number(maxQuantity) : null,
            turnaroundHours: Number(turnaroundHours || 24),
            isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
            itemRatesJson: typeof itemRatesJson === 'object' ? JSON.stringify(itemRatesJson) : itemRatesJson,
            tariffHeroTitle: tariffHeroTitle || 'Express Campus Laundry',
            tariffHeroSubtitle: tariffHeroSubtitle || 'Automated wash, fabric softening & steam iron with room-to-room pickup across Halls 1–14',
            tariffTag: tariffTag || 'DUAL-OTP',
            tariffBadge: tariffBadge || 'SUBSIDIZED TARIFF'
          }
        });
      }

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'LAUNDRY_PRICING_CONFIG_UPDATED',
        entity: 'LaundryServiceConfig',
        entityId: config.id,
        newValue: {
          serviceName: config.serviceName,
          providerPrice: config.providerPricePerUnit,
          serviceCharge: config.serviceChargePerUnit,
          unit: config.pricingUnit
        },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Laundry pricing & service charge updated successfully!',
        config
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a service config
   */
  public static async deletePricingConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.laundryServiceConfig.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Service configuration removed.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Live calculation preview for Admin Dashboard (Requirement #30)
   */
  public static async getPricingPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerPrice = Math.max(0, Number(req.query.providerPrice ?? 15));
      const serviceCharge = Math.max(0, Number(req.query.serviceCharge ?? 1));
      const quantity = Math.max(1, Number(req.query.quantity ?? 5));
      const unit = (req.query.unit as string) || 'dress';

      const providerTotal = Math.round(providerPrice * quantity * 100) / 100;
      const serviceChargeTotal = Math.round(serviceCharge * quantity * 100) / 100;
      const studentTotal = Math.round((providerTotal + serviceChargeTotal) * 100) / 100;

      res.status(200).json({
        success: true,
        preview: {
          unit,
          quantity,
          providerPricePerUnit: providerPrice,
          serviceChargePerUnit: serviceCharge,
          studentPricePerUnit: providerPrice + serviceCharge,
          calculation: {
            providerAmount: providerTotal,
            serviceChargeAmount: serviceChargeTotal,
            studentTotal
          },
          codBreakdown: {
            payOnlineAdvance: serviceChargeTotal,
            payToProviderOnDelivery: providerTotal,
            totalEconomicValue: studentTotal
          },
          onlineBreakdown: {
            payOnlineTotal: studentTotal,
            providerPayableAfterDelivery: providerTotal,
            platformRetainedServiceCharge: serviceChargeTotal
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Global Laundry Settings (Service charge refundability, COD toggle, OTP expiration)
   */
  public static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await prisma.adminSetting.findMany({
        where: {
          key: {
            in: [
              'LAUNDRY_DEFAULT_SERVICE_CHARGE',
              'LAUNDRY_SERVICE_CHARGE_REFUNDABLE',
              'LAUNDRY_COD_ENABLED',
              'LAUNDRY_PICKUP_OTP_EXPIRY_MINUTES',
              'LAUNDRY_DELIVERY_OTP_EXPIRY_MINUTES'
            ]
          }
        }
      });

      const map: Record<string, string> = {};
      settings.forEach((s) => {
        map[s.key] = s.value;
      });

      res.status(200).json({
        success: true,
        settings: {
          defaultServiceCharge: Number(map['LAUNDRY_DEFAULT_SERVICE_CHARGE'] || 1),
          serviceChargeRefundable: map['LAUNDRY_SERVICE_CHARGE_REFUNDABLE'] !== 'false',
          codEnabled: map['LAUNDRY_COD_ENABLED'] !== 'false',
          pickupOtpExpiryMinutes: Number(map['LAUNDRY_PICKUP_OTP_EXPIRY_MINUTES'] || 60),
          deliveryOtpExpiryMinutes: Number(map['LAUNDRY_DELIVERY_OTP_EXPIRY_MINUTES'] || 120)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Global Laundry Settings
   */
  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        defaultServiceCharge,
        serviceChargeRefundable,
        codEnabled,
        pickupOtpExpiryMinutes,
        deliveryOtpExpiryMinutes
      } = req.body;

      const entries: Array<{ key: string; value: string; desc: string }> = [
        { key: 'LAUNDRY_DEFAULT_SERVICE_CHARGE', value: String(defaultServiceCharge ?? 1), desc: 'Default laundry service charge per unit' },
        { key: 'LAUNDRY_SERVICE_CHARGE_REFUNDABLE', value: String(serviceChargeRefundable ?? true), desc: 'Whether laundry service charge is refundable' },
        { key: 'LAUNDRY_COD_ENABLED', value: String(codEnabled ?? true), desc: 'Allow COD for laundry orders' },
        { key: 'LAUNDRY_PICKUP_OTP_EXPIRY_MINUTES', value: String(pickupOtpExpiryMinutes ?? 60), desc: 'Minutes before pickup OTP expires' },
        { key: 'LAUNDRY_DELIVERY_OTP_EXPIRY_MINUTES', value: String(deliveryOtpExpiryMinutes ?? 120), desc: 'Minutes before delivery OTP expires' }
      ];

      for (const item of entries) {
        await prisma.adminSetting.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: { key: item.key, value: item.value, description: item.desc }
        });
      }

      await AuditService.log(prisma, {
        userId: req.user?.userId,
        action: 'LAUNDRY_GLOBAL_SETTINGS_UPDATED',
        entity: 'AdminSetting',
        newValue: req.body,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Laundry settings updated successfully!'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Laundry Financial Overview & Multi-filter Table (Requirement #38)
   */
  public static async getFinancialOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        providerId,
        paymentMethod,
        paymentStatus,
        orderStatus,
        settlementStatus,
        refundStatus,
        startDate,
        endDate
      } = req.query;

      let orders = await prisma.laundryOrder.findMany({
        where: {
          ...(providerId ? { providerId: String(providerId) } : {}),
          ...(paymentMethod ? { paymentMethod: String(paymentMethod) } : {}),
          ...(paymentStatus ? { paymentStatus: String(paymentStatus) } : {}),
          ...(orderStatus ? { status: String(orderStatus) as any } : {}),
          ...(settlementStatus ? { settlementStatus: String(settlementStatus) } : {}),
          ...(refundStatus ? { refundStatus: String(refundStatus) } : {})
        },
        include: {
          student: { select: { fullName: true, mobileNumber: true, roomNumber: true } },
          provider: { select: { fullName: true, mobileNumber: true } },
          items: true,
          codCollection: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (startDate) {
        const s = new Date(String(startDate));
        orders = orders.filter((o) => new Date(o.createdAt) >= s);
      }
      if (endDate) {
        const e = new Date(String(endDate));
        orders = orders.filter((o) => new Date(o.createdAt) <= e);
      }

      // Aggregate totals
      let totalLaundrySales = 0;
      let providerLaundryAmount = 0;
      let serviceChargesAmount = 0;
      let onlinePayments = 0;
      let codCollected = 0;
      let pendingRefunds = 0;
      let completedRefunds = 0;
      let pendingSettlements = 0;
      let settledAmount = 0;

      orders.forEach((o) => {
        const total = Number(o.totalAmount || o.finalPrice || o.estimatedPrice || 0);
        const base = Number(o.laundryBaseAmount || total * 0.95);
        const sc = Number(o.serviceChargeAmount || total * 0.05);

        totalLaundrySales += total;
        providerLaundryAmount += base;
        serviceChargesAmount += sc;

        if (o.paymentMethod === 'ONLINE' && o.paymentStatus === 'PAID') {
          onlinePayments += total;
        } else if (o.paymentMethod === 'COD') {
          onlinePayments += Number(o.onlinePaidAmount || sc);
          if (o.codStatus === 'COLLECTED') {
            codCollected += Number(o.codCollectedAmount || base);
          }
        }

        if (o.refundStatus === 'PROCESSING' || o.refundStatus === 'REQUESTED') {
          pendingRefunds += total;
        } else if (o.refundStatus === 'COMPLETED' || o.refundStatus === 'REFUNDED') {
          completedRefunds += total;
        }

        if (o.settlementStatus === 'ELIGIBLE' || o.settlementStatus === 'PENDING') {
          pendingSettlements += base;
        } else if (o.settlementStatus === 'SETTLED') {
          settledAmount += base;
        }
      });

      res.status(200).json({
        success: true,
        summary: {
          totalLaundrySales: Math.round(totalLaundrySales * 100) / 100,
          providerLaundryAmount: Math.round(providerLaundryAmount * 100) / 100,
          campusBasketServiceCharges: Math.round(serviceChargesAmount * 100) / 100,
          onlinePayments: Math.round(onlinePayments * 100) / 100,
          codCollected: Math.round(codCollected * 100) / 100,
          pendingRefunds: Math.round(pendingRefunds * 100) / 100,
          completedRefunds: Math.round(completedRefunds * 100) / 100,
          pendingSettlements: Math.round(pendingSettlements * 100) / 100,
          settledAmount: Math.round(settledAmount * 100) / 100,
          ordersCount: orders.length
        },
        orders
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Filtered Laundry Financial CSV Report Export (Requirement #39 & #40)
   */
  public static async exportFinancialReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        providerId,
        paymentMethod,
        paymentStatus,
        orderStatus,
        settlementStatus
      } = req.query;

      const orders = await prisma.laundryOrder.findMany({
        where: {
          ...(providerId ? { providerId: String(providerId) } : {}),
          ...(paymentMethod ? { paymentMethod: String(paymentMethod) } : {}),
          ...(paymentStatus ? { paymentStatus: String(paymentStatus) } : {}),
          ...(orderStatus ? { status: String(orderStatus) as any } : {}),
          ...(settlementStatus ? { settlementStatus: String(settlementStatus) } : {})
        },
        include: {
          student: { select: { fullName: true } },
          provider: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const headers = [
        'Order ID',
        'Student',
        'Laundry Provider',
        'Laundry Amount (Base)',
        'Campus Basket Service Charge',
        'Total Order Value',
        'Payment Method',
        'Online Paid',
        'COD Amount',
        'COD Collected',
        'Payment Status',
        'Laundry Status',
        'Refund Status',
        'Settlement Status',
        'Date'
      ];

      const rows = orders.map((o) => {
        const total = Number(o.totalAmount || o.finalPrice || o.estimatedPrice || 0);
        const base = Number(o.laundryBaseAmount || total * 0.95);
        const sc = Number(o.serviceChargeAmount || total * 0.05);

        return [
          o.orderNumber,
          `"${o.student?.fullName || 'Student'}"`,
          `"${o.provider?.fullName || 'Laundry Provider'}"`,
          base.toFixed(2),
          sc.toFixed(2),
          total.toFixed(2),
          o.paymentMethod,
          Number(o.onlinePaidAmount || (o.paymentMethod === 'ONLINE' ? total : sc)).toFixed(2),
          Number(o.codAmount || (o.paymentMethod === 'COD' ? base : 0)).toFixed(2),
          Number(o.codCollectedAmount || 0).toFixed(2),
          o.paymentStatus,
          o.status,
          o.refundStatus,
          o.settlementStatus,
          new Date(o.createdAt).toISOString().split('T')[0]
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="laundry-financial-report-${Date.now()}.csv"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}
