import { prisma } from '../../config/database';

export interface LaundryCalculationResult {
  serviceConfigId?: string;
  serviceName: string;
  pricingUnit: string;
  pricingModel: string;
  unitDisplayName: string;
  providerPricePerUnit: number;
  basePricePerUnit: number;
  serviceChargePerUnit: number;
  totalQuantity: number;
  laundryBaseAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  onlinePaidAmount: number;
  codAmount: number;
  onlinePayableNow: number;
  codAmountPayableOnDelivery: number;
  providerPayableAmount: number;
  platformRetainedAmount: number;
  itemsBreakdown: Array<{
    itemType: string;
    quantity: number;
    unitPrice: number;
    baseSubtotal: number;
    serviceChargeSubtotal: number;
    itemTotal: number;
  }>;
  snapshot: any;
  priceSnapshot: any;
}

export class LaundryPricingService {
  /**
   * Checks whether the service charge is configured to be refundable on cancellation.
   */
  public static async isServiceChargeRefundable(): Promise<boolean> {
    try {
      const setting = await prisma.adminSetting.findUnique({
        where: { key: 'LAUNDRY_SERVICE_CHARGE_REFUNDABLE' }
      });
      return setting ? setting.value === 'true' : true;
    } catch {
      return true;
    }
  }

  /**
   * Fetch active service configuration for a specific provider or service name.
   * Falls back to default 'Wash & Iron' config if not found.
   */
  public static async getServiceConfig(providerId?: string | null, serviceName?: string | null) {
    let config: any = null;

    if (serviceName) {
      config = await prisma.laundryServiceConfig.findFirst({
        where: {
          serviceName: { equals: serviceName, mode: 'insensitive' } as any,
          isAvailable: true,
          ...(providerId ? { providerId } : {})
        }
      });
    }

    if (!config && providerId) {
      config = await prisma.laundryServiceConfig.findFirst({
        where: { providerId, isAvailable: true }
      });
    }

    if (!config) {
      config = await prisma.laundryServiceConfig.findFirst({
        where: { isAvailable: true }
      });
    }

    if (!config) {
      // Hard fallback if database completely empty
      return {
        id: 'lsc_default',
        providerId: null,
        serviceName: 'Wash & Iron',
        pricingUnit: 'per_dress',
        unitDisplayName: 'per garment',
        providerPricePerUnit: 15,
        serviceChargePerUnit: 1,
        minQuantity: 1,
        turnaroundHours: 24,
        isAvailable: true,
        itemRatesJson: JSON.stringify({
          Shirt: 15,
          'T-Shirt': 15,
          Pants: 20,
          Jeans: 25,
          Kurta: 20,
          Bedsheet: 35,
          Towel: 15,
          Blanket: 90
        }),
        tariffHeroTitle: 'Express Campus Laundry',
        tariffHeroSubtitle: 'Automated wash, fabric softening & steam iron with room-to-room pickup across Halls 1–14',
        tariffTag: 'DUAL-OTP',
        tariffBadge: 'SUBSIDIZED TARIFF'
      };
    }

    return config;
  }

  /**
   * Calculate complete laundry price separation (Base + Service Charge)
   * Enforces that service charge is calculated strictly on quantity of eligible garments/units.
   */
  public static async calculatePricing(params: {
    serviceConfigId?: string | null;
    serviceName?: string | null;
    providerId?: string | null;
    itemCount?: number;
    items?: Array<{ itemType?: string; category?: string; quantity?: number; count?: number }>;
    paymentMethod: 'ONLINE' | 'COD';
  }): Promise<LaundryCalculationResult> {
    const config = params.serviceConfigId
      ? (await prisma.laundryServiceConfig.findUnique({ where: { id: params.serviceConfigId } })) ||
        (await this.getServiceConfig(params.providerId, params.serviceName))
      : await this.getServiceConfig(params.providerId, params.serviceName);

    let parsedRates: Record<string, number> = {};
    try {
      if (config.itemRatesJson) {
        parsedRates = typeof config.itemRatesJson === 'string' ? JSON.parse(config.itemRatesJson) : config.itemRatesJson;
      }
    } catch {
      parsedRates = {};
    }

    const providerPricePerUnit = Number(config.providerPricePerUnit || 15);
    const serviceChargePerUnit = Number(config.serviceChargePerUnit || 1);
    const pricingModel = config.pricingUnit === 'per_kg' ? 'PER_KG' : 'PER_ITEM';

    let laundryBaseAmount = 0;
    let totalQuantity = 0;

    const rawItems = params.items && params.items.length > 0
      ? params.items
      : [{ itemType: 'Garment', quantity: params.itemCount || 1 }];

    const itemsBreakdown = rawItems.map((item) => {
      const type = item.itemType || item.category || 'Garment';
      const qty = Math.max(0, Number(item.quantity !== undefined ? item.quantity : item.count) || 0);
      totalQuantity += qty;

      const unitPrice = parsedRates[type] !== undefined ? Number(parsedRates[type]) : providerPricePerUnit;
      const baseSubtotal = unitPrice * qty;
      const scSubtotal = serviceChargePerUnit * qty;

      laundryBaseAmount += baseSubtotal;

      return {
        itemType: type,
        quantity: qty,
        unitPrice,
        baseSubtotal,
        serviceChargeSubtotal: scSubtotal,
        itemTotal: baseSubtotal + scSubtotal
      };
    });

    // Campus Basket Laundry Service Charge: ₹X per dress/item
    const serviceChargeAmount = Math.round(serviceChargePerUnit * totalQuantity * 100) / 100;
    const totalAmount = Math.round((laundryBaseAmount + serviceChargeAmount) * 100) / 100;

    let onlinePaidAmount = 0;
    let codAmount = 0;

    if (params.paymentMethod === 'ONLINE') {
      onlinePaidAmount = totalAmount;
      codAmount = 0;
    } else {
      // COD Rule: Student MUST pay Campus Basket service charge online in advance
      onlinePaidAmount = serviceChargeAmount;
      codAmount = laundryBaseAmount;
    }

    const snapshot = {
      serviceName: config.serviceName,
      pricingUnit: config.pricingUnit,
      pricingModel,
      unitDisplayName: config.unitDisplayName || 'per garment',
      providerPricePerUnit,
      basePricePerUnit: providerPricePerUnit,
      serviceChargePerUnit,
      totalQuantity,
      laundryBaseAmount,
      serviceChargeAmount,
      totalAmount,
      paymentMethod: params.paymentMethod,
      itemsBreakdown,
      lockedAt: new Date().toISOString(),
      calculatedAt: new Date().toISOString()
    };

    return {
      serviceConfigId: config.id,
      serviceName: config.serviceName,
      pricingUnit: config.pricingUnit,
      pricingModel,
      unitDisplayName: config.unitDisplayName || 'per garment',
      providerPricePerUnit,
      basePricePerUnit: providerPricePerUnit,
      serviceChargePerUnit,
      totalQuantity,
      laundryBaseAmount,
      serviceChargeAmount,
      totalAmount,
      onlinePaidAmount,
      codAmount,
      onlinePayableNow: onlinePaidAmount,
      codAmountPayableOnDelivery: codAmount,
      providerPayableAmount: laundryBaseAmount,
      platformRetainedAmount: serviceChargeAmount,
      itemsBreakdown,
      snapshot,
      priceSnapshot: snapshot
    };
  }

  /**
   * Return booking payload for frontend booking drawer & hero card
   */
  public static async getBookingConfig(providerId?: string | null) {
    const activeConfigs = await prisma.laundryServiceConfig.findMany({
      where: {
        isAvailable: true,
        ...(providerId ? { providerId } : {})
      }
    });

    const primary = activeConfigs[0] || (await this.getServiceConfig(providerId));

    let itemRates: Record<string, number> = {};
    try {
      if (primary.itemRatesJson) {
        itemRates = typeof primary.itemRatesJson === 'string' ? JSON.parse(primary.itemRatesJson) : primary.itemRatesJson;
      }
    } catch {
      itemRates = {};
    }

    // Read global settings
    const scRefundableSetting = await prisma.adminSetting.findUnique({
      where: { key: 'LAUNDRY_SERVICE_CHARGE_REFUNDABLE' }
    });
    const codEnabledSetting = await prisma.adminSetting.findUnique({
      where: { key: 'LAUNDRY_COD_ENABLED' }
    });

    return {
      tariff: {
        heroTitle: primary.tariffHeroTitle || 'Express Campus Laundry',
        heroSubtitle: primary.tariffHeroSubtitle || 'Automated wash, fabric softening & steam iron with room-to-room pickup across Halls 1–14',
        tariffTag: primary.tariffTag || 'DUAL-OTP',
        tariffBadge: primary.tariffBadge || 'SUBSIDIZED TARIFF',
        unitDisplayName: primary.unitDisplayName || 'per garment',
        providerPricePerUnit: Number(primary.providerPricePerUnit || 15),
        serviceChargePerUnit: Number(primary.serviceChargePerUnit || 1),
        studentPricePerUnit: Number(primary.providerPricePerUnit || 15) + Number(primary.serviceChargePerUnit || 1)
      },
      itemRates,
      availableServices: activeConfigs.map((c) => ({
        id: c.id,
        serviceName: c.serviceName,
        pricingUnit: c.pricingUnit,
        unitDisplayName: c.unitDisplayName,
        providerPricePerUnit: Number(c.providerPricePerUnit),
        serviceChargePerUnit: Number(c.serviceChargePerUnit),
        studentPricePerUnit: Number(c.providerPricePerUnit) + Number(c.serviceChargePerUnit),
        turnaroundHours: c.turnaroundHours
      })),
      policy: {
        codEnabled: codEnabledSetting ? codEnabledSetting.value === 'true' : true,
        serviceChargeRefundable: scRefundableSetting ? scRefundableSetting.value === 'true' : true
      }
    };
  }
}
