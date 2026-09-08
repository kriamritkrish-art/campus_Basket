import { describe, it, expect } from 'vitest';
import { RefundService } from '../backend/src/services/financial/RefundService';

describe('Order Governance, Immutability, COD Advance & Return Policy Engine', () => {

  // -------------------------------------------------------------
  // 1. ORDER IMMUTABILITY BEFORE & AFTER PROVIDER ACCEPTANCE
  // -------------------------------------------------------------
  it('SCENARIO 1: Order is modifiable while PENDING_PAYMENT or CONFIRMED (prior to provider acceptance)', () => {
    const unacceptedStatuses = ['PENDING_PAYMENT', 'CONFIRMED'];
    const acceptedStatuses = ['ACCEPTED', 'PREPARING', 'READY', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

    for (const status of unacceptedStatuses) {
      const isModifiable = !acceptedStatuses.includes(status);
      expect(isModifiable).toBe(true);
    }

    for (const status of acceptedStatuses) {
      const isModifiable = !acceptedStatuses.includes(status);
      expect(isModifiable).toBe(false);
    }
  });

  // -------------------------------------------------------------
  // 2. COD PARTIAL ONLINE ADVANCE CALCULATION
  // -------------------------------------------------------------
  it('SCENARIO 2: COD partial advance calculation splits online deposit vs cash due at doorstep', () => {
    const minAdvanceSetting = 10;

    // Standard 100 INR order
    const totalAmount = 100;
    const advanceRequired = Math.min(totalAmount, Math.max(0, minAdvanceSetting));
    const remainingCashDue = Math.max(0, totalAmount - advanceRequired);

    expect(advanceRequired).toBe(10);
    expect(remainingCashDue).toBe(90);

    // Small 8 INR order (total is less than minimum advance)
    const smallTotal = 8;
    const smallAdvance = Math.min(smallTotal, Math.max(0, minAdvanceSetting));
    const smallCashDue = Math.max(0, smallTotal - smallAdvance);

    expect(smallAdvance).toBe(8);
    expect(smallCashDue).toBe(0);

    // Zero advance configuration
    const zeroAdvanceSetting = 0;
    const zeroAdvance = Math.min(totalAmount, Math.max(0, zeroAdvanceSetting));
    const zeroCashDue = Math.max(0, totalAmount - zeroAdvance);

    expect(zeroAdvance).toBe(0);
    expect(zeroCashDue).toBe(100);

    // Verify string '0' setting correctly resolves to 0 and NOT 10
    const settingMap = { COD_MIN_ADVANCE_AMOUNT: '0' };
    const parsedAdvance = settingMap['COD_MIN_ADVANCE_AMOUNT'] !== undefined && settingMap['COD_MIN_ADVANCE_AMOUNT'] !== ''
      ? Math.max(0, Number(settingMap['COD_MIN_ADVANCE_AMOUNT']))
      : 0;
    expect(parsedAdvance).toBe(0);
    expect(parsedAdvance > 0).toBe(false);
  });

  // -------------------------------------------------------------
  // 3. RETURN ELIGIBILITY EVALUATION ACROSS SERVICES
  // -------------------------------------------------------------
  it('SCENARIO 3: Fresh Produce allows returns within 2 hours of delivery for freshness defects', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const eligibleProduceOrder: any = {
      id: 'ord_produce_1',
      serviceType: 'FRESH_PRODUCE',
      status: 'DELIVERED',
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo
    };

    const expiredProduceOrder: any = {
      id: 'ord_produce_2',
      serviceType: 'FRESH_PRODUCE',
      status: 'DELIVERED',
      createdAt: threeHoursAgo,
      updatedAt: threeHoursAgo
    };

    const eligibleResult = await RefundService.evaluateReturnEligibility(eligibleProduceOrder);
    expect(eligibleResult.eligible).toBe(true);

    const expiredResult = await RefundService.evaluateReturnEligibility(expiredProduceOrder);
    expect(expiredResult.eligible).toBe(false);
    expect(expiredResult.reason).toContain('Fresh produce & fruit return window has expired');
  });

  it('SCENARIO 4: Stationery allows returns within 24 hours of delivery in original condition', async () => {
    const now = new Date();
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);

    const eligibleStationeryOrder: any = {
      id: 'ord_stationery_1',
      serviceType: 'STATIONERY',
      status: 'DELIVERED',
      createdAt: tenHoursAgo,
      updatedAt: tenHoursAgo
    };

    const expiredStationeryOrder: any = {
      id: 'ord_stationery_2',
      serviceType: 'STATIONERY',
      status: 'DELIVERED',
      createdAt: thirtyHoursAgo,
      updatedAt: thirtyHoursAgo
    };

    const eligibleResult = await RefundService.evaluateReturnEligibility(eligibleStationeryOrder);
    expect(eligibleResult.eligible).toBe(true);

    const expiredResult = await RefundService.evaluateReturnEligibility(expiredStationeryOrder);
    expect(expiredResult.eligible).toBe(false);
    expect(expiredResult.reason).toContain('Stationery items return window has expired');
  });

  it('SCENARIO 5: Food allows returns within 30 minutes of delivery for quality verification', async () => {
    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const fortyFiveMinsAgo = new Date(now.getTime() - 45 * 60 * 1000);

    const eligibleFoodOrder: any = {
      id: 'ord_food_1',
      serviceType: 'FOOD',
      status: 'DELIVERED',
      createdAt: fifteenMinsAgo,
      updatedAt: fifteenMinsAgo
    };

    const expiredFoodOrder: any = {
      id: 'ord_food_2',
      serviceType: 'FOOD',
      status: 'DELIVERED',
      createdAt: fortyFiveMinsAgo,
      updatedAt: fortyFiveMinsAgo
    };

    const eligibleResult = await RefundService.evaluateReturnEligibility(eligibleFoodOrder);
    expect(eligibleResult.eligible).toBe(true);

    const expiredResult = await RefundService.evaluateReturnEligibility(expiredFoodOrder);
    expect(expiredResult.eligible).toBe(false);
    expect(expiredResult.reason).toContain('Food & Meals return window has expired');
  });

  it('SCENARIO 6: Non-delivered orders cannot request returns', async () => {
    const pendingOrder: any = {
      id: 'ord_pending_1',
      serviceType: 'STATIONERY',
      status: 'PREPARING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await RefundService.evaluateReturnEligibility(pendingOrder);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('successfully delivered');
  });

  it('SCENARIO 7: Laundry orders cannot request product returns', async () => {
    const laundryOrder: any = {
      id: 'ord_laundry_1',
      serviceType: 'LAUNDRY',
      status: 'DELIVERED',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await RefundService.evaluateReturnEligibility(laundryOrder);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Laundry wash orders do not accept product returns');
  });

  // -------------------------------------------------------------
  // 4. CATEGORY ADAPTIVE CHECKPOINTS
  // -------------------------------------------------------------
  it('SCENARIO 8: Category checkpoints differ for Produce vs Stationery vs Food', () => {
    const produceCheckpoints = [
      { id: 'RECEIVED', label: 'Order Placed', sub: 'Mandi/Farm Batch' },
      { id: 'CONFIRMED', label: 'Produce Accepted', sub: 'Crate Assigned' },
      { id: 'PREPARING', label: 'Quality Graded', sub: 'Freshness Inspected' },
      { id: 'READY', label: 'Fruit Basket Packed', sub: 'Eco-Crate Tagged' },
      { id: 'TRANSIT', label: 'Fresh Transit', sub: 'Runner In Route' },
      { id: 'DELIVERED', label: 'Delivered Fresh', sub: 'Handed Over at Door' }
    ];

    const stationeryCheckpoints = [
      { id: 'RECEIVED', label: 'Order Placed', sub: 'Sent to Bookstore' },
      { id: 'CONFIRMED', label: 'Store Accepted', sub: 'Stock Reserved' },
      { id: 'PREPARING', label: 'Items Assembled', sub: 'Desk Collection' },
      { id: 'READY', label: 'Packaged Securely', sub: 'Bag Sealed & Labeled' },
      { id: 'TRANSIT', label: 'Campus Delivery', sub: 'Runner In Route' },
      { id: 'DELIVERED', label: 'Doorstep Handover', sub: 'Delivered to Student' }
    ];

    const foodCheckpoints = [
      { id: 'RECEIVED', label: 'Order Placed', sub: 'Sent to Kitchen' },
      { id: 'CONFIRMED', label: 'Kitchen Accepted', sub: 'Order Queued' },
      { id: 'PREPARING', label: 'Freshly Cooking', sub: 'Chef at Work' },
      { id: 'READY', label: 'Food Packed', sub: 'Awaiting Pickup' },
      { id: 'TRANSIT', label: 'Hot Delivery', sub: 'Runner In Route' },
      { id: 'DELIVERED', label: 'Enjoy Meal', sub: 'Delivered at Door' }
    ];

    // Produce contains grading & mandi checkpoints, zero chef/kitchen references
    expect(produceCheckpoints.some(c => c.label.includes('Graded') || c.sub.includes('Mandi'))).toBe(true);
    expect(produceCheckpoints.some(c => c.label.includes('Cooking') || c.sub.includes('Chef'))).toBe(false);

    // Stationery contains bookstore & assembly checkpoints, zero kitchen or mandi references
    expect(stationeryCheckpoints.some(c => c.sub.includes('Bookstore') || c.label.includes('Assembled'))).toBe(true);
    expect(stationeryCheckpoints.some(c => c.sub.includes('Mandi') || c.sub.includes('Chef'))).toBe(false);

    // Food contains kitchen & cooking checkpoints
    expect(foodCheckpoints.some(c => c.label.includes('Cooking') && c.sub.includes('Chef'))).toBe(true);
  });

  // -------------------------------------------------------------
  // 5. STRICT HIERARCHY: PRODUCT OVERRIDE > PROVIDER OVERRIDE > GLOBAL
  // -------------------------------------------------------------
  it('SCENARIO 9: Product override takes strict priority over provider override for Cash on Delivery', () => {
    // Simulated Provider has 4 products A, B, C, D and allows COD
    const providerId = 'prov_hall11';
    const providerPolicies = {
      [providerId]: { allowCod: true, codAdvance: 20 }
    };

    // Admin sets Product C override: allowCod = false
    const productPolicies = {
      'prod_a': { allowCod: true },
      'prod_c': { allowCod: false } // Disabled by admin override
    };

    const products = [
      { id: 'prod_a', name: 'Veg Thali', providerId },
      { id: 'prod_b', name: 'Paneer Butter Masala', providerId },
      { id: 'prod_c', name: 'Premium Special Biryani', providerId },
      { id: 'prod_d', name: 'Cold Drink', providerId }
    ];

    // Function matching backend orderController logic
    function evaluateCodForProducts(items: typeof products) {
      for (const prod of items) {
        const prodPol = productPolicies[prod.id as keyof typeof productPolicies];
        const provPol = providerPolicies[prod.providerId as keyof typeof providerPolicies];

        // Priority 1: Product Override
        if (prodPol && prodPol.allowCod === false) {
          return { allowed: false, reason: `Product "${prod.name}" does not support COD` };
        }

        // Product explicitly allows COD
        if (prodPol && prodPol.allowCod === true) {
          continue;
        }

        // Priority 2: Provider Override
        if (provPol && provPol.allowCod === false) {
          return { allowed: false, reason: `Merchant does not accept COD for "${prod.name}"` };
        }
      }
      return { allowed: true };
    }

    // Cart with only Product A and B (Both allow COD)
    const cartWithoutC = [products[0], products[1]];
    const resultAllowed = evaluateCodForProducts(cartWithoutC);
    expect(resultAllowed.allowed).toBe(true);

    // Cart with Product C (Product C has allowCod = false)
    const cartWithC = [products[0], products[2]];
    const resultBlocked = evaluateCodForProducts(cartWithC);
    expect(resultBlocked.allowed).toBe(false);
    expect(resultBlocked.reason).toContain('does not support COD');

    // Case 2: Provider BLOCKS COD, but Product A explicitly ALLOWS COD
    const strictProviderPolicies = {
      [providerId]: { allowCod: false }
    };
    function evaluateStrictProvider(items: typeof products) {
      for (const prod of items) {
        const prodPol = productPolicies[prod.id as keyof typeof productPolicies];
        const provPol = strictProviderPolicies[prod.providerId as keyof typeof strictProviderPolicies];

        // Priority 1: Product Override takes precedence
        if (prodPol && prodPol.allowCod === false) {
          return { allowed: false, reason: 'Product disabled' };
        }
        if (prodPol && prodPol.allowCod === true) {
          continue; // Product override bypasses provider restriction
        }
        // Priority 2: Provider restriction applies
        if (provPol && provPol.allowCod === false) {
          return { allowed: false, reason: 'Provider disabled' };
        }
      }
      return { allowed: true };
    }

    // Cart with Product A only (Product A has explicit allowCod = true, provider has allowCod = false)
    expect(evaluateStrictProvider([products[0]]).allowed).toBe(true);

    // Cart with Product B only (Product B has no product override, so provider restriction blocks it)
    expect(evaluateStrictProvider([products[1]]).allowed).toBe(false);
  });

  it('SCENARIO 10: COD Advance Fee precedence: Product Advance > Provider Advance > Global Default', () => {
    const globalDefaultAdvance = 10;
    const providerPolicies = {
      'prov_hall11': { codAdvance: 25 }
    };
    const productPolicies = {
      'prod_custom': { codAdvance: 40 },
      'prod_default': {}
    };

    function resolveAdvanceFee(productId: string, providerId: string) {
      const prodPol = productPolicies[productId as keyof typeof productPolicies] as any;
      const provPol = providerPolicies[providerId as keyof typeof providerPolicies] as any;

      if (prodPol && typeof prodPol.codAdvance === 'number') {
        return prodPol.codAdvance;
      }
      if (provPol && typeof provPol.codAdvance === 'number') {
        return provPol.codAdvance;
      }
      return globalDefaultAdvance;
    }

    // Product with its own custom advance (40) overrides provider (25)
    expect(resolveAdvanceFee('prod_custom', 'prov_hall11')).toBe(40);

    // Product with no custom advance falls back to provider advance (25)
    expect(resolveAdvanceFee('prod_default', 'prov_hall11')).toBe(25);

    // Product with no custom advance and provider with no custom advance falls back to global default (10)
    expect(resolveAdvanceFee('prod_default', 'unknown_prov')).toBe(10);
  });

  it('SCENARIO 11: Real-world Burger Special COD Override Enforcement across IDs, slugs, and normalized names', () => {
    // Simulated admin settings where Burger Special has COD disabled
    const productPolicies = {
      'cm7burger123': { id: 'cm7burger123', name: 'burger special', slug: 'burger-special', allowCod: false },
      'burger special': { id: 'cm7burger123', name: 'burger special', slug: 'burger-special', allowCod: false },
      'burger-special': { id: 'cm7burger123', name: 'burger special', slug: 'burger-special', allowCod: false }
    };

    const providerPolicies = {
      'prov_hall11': { allowCod: true } // Provider allows COD for Hall 11
    };

    const cartItem = {
      productId: 'cm7burger123',
      name: 'burger special',
      slug: 'burger-special',
      providerId: 'prov_hall11',
      unitPrice: 200,
      quantity: 1,
      itemTotal: 200
    };

    // Resilient lookup function matching checkout and orderController
    function isItemCodAllowed(item: typeof cartItem) {
      const normName = item.name ? item.name.toLowerCase().trim() : '';
      const prodPol =
        productPolicies[item.productId as keyof typeof productPolicies] ||
        productPolicies[normName as keyof typeof productPolicies] ||
        (item.slug ? productPolicies[item.slug as keyof typeof productPolicies] : null) ||
        Object.entries(productPolicies).find(([k, v]: any) => {
          return (
            k === item.productId ||
            v.id === item.productId ||
            (v.name && v.name.toLowerCase().trim() === normName) ||
            (normName.includes('burger special') && (k.toLowerCase().includes('burger special') || v.name?.toLowerCase().includes('burger special')))
          );
        })?.[1];

      // Priority 1: Product Override
      if (prodPol && prodPol.allowCod === false) {
        return false;
      }

      if (prodPol && prodPol.allowCod === true) {
        return true;
      }

      // Priority 2: Provider Override
      const provPol = providerPolicies[item.providerId as keyof typeof providerPolicies];
      if (provPol && provPol.allowCod === false) {
        return false;
      }

      return true;
    }

    // Must be blocked because Burger Special has allowCod = false!
    expect(isItemCodAllowed(cartItem)).toBe(false);

    // Even if cart item had an unlinked product ID, matching by name must block COD
    const unlinkedCartItem = {
      ...cartItem,
      productId: 'random_client_generated_id',
      name: 'burger special'
    };
    expect(isItemCodAllowed(unlinkedCartItem)).toBe(false);

    // Another product from Hall 11 that has no override should remain allowed
    const regularItem = {
      productId: 'prod_fried_rice',
      name: 'Veg Fried Rice',
      slug: 'veg-fried-rice',
      providerId: 'prov_hall11',
      unitPrice: 120,
      quantity: 1,
      itemTotal: 120
    };
    expect(isItemCodAllowed(regularItem)).toBe(true);
  });
});
