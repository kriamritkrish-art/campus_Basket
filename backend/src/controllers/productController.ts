import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { fallbackProducts, fallbackCategories } from '../services/fallbackData';

export class ProductController {
  /**
   * List products with search, category filtering, price filtering, and pagination
   */
  public static async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        category,
        search,
        featured,
        minPrice,
        maxPrice,
        inStockOnly,
        page = '1',
        limit = '20'
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        availability: true,
        approvalStatus: 'APPROVED',
        AND: [
          {
            OR: [
              { providerId: null },
              { provider: { activeStatus: true } }
            ]
          }
        ]
      };

      if (category) {
        where.category = { slug: category as string };
      }

      if (search) {
        where.AND.push({
          OR: [
            { name: { contains: search as string } },
            { description: { contains: search as string } },
            { subcategory: { contains: search as string } },
            { tags: { contains: search as string } },
            { category: { name: { contains: search as string } } }
          ]
        });
      }

      if (featured === 'true') {
        where.isFeatured = true;
      }

      if (inStockOnly === 'true') {
        where.stock = { gt: 0 };
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice as string);
        if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
      }

      const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          include: {
            category: true,
            images: true,
            inventory: true,
            reviews: {
              where: { isHidden: false },
              select: { rating: true }
            }
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        })
      ]);

      let productPolicies: Record<string, any> = {};
      let providerPolicies: Record<string, any> = {};
      try {
        const polSettings = await prisma.adminSetting.findMany({
          where: { key: { in: ['PRODUCT_ORDER_POLICIES', 'PROVIDER_ORDER_POLICIES'] } }
        });
        const prodPolSetting = polSettings.find((s) => s.key === 'PRODUCT_ORDER_POLICIES');
        const provPolSetting = polSettings.find((s) => s.key === 'PROVIDER_ORDER_POLICIES');
        if (prodPolSetting?.value) productPolicies = JSON.parse(prodPolSetting.value);
        if (provPolSetting?.value) providerPolicies = JSON.parse(provPolSetting.value);
      } catch {}

      let formattedProducts: any[] = products.map((p) => {
        const reviews = p.reviews || [];
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
            : 5.0;

        const images = p.images || [];
        const primaryImage =
          (p as any).image ||
          images.find((img) => img.isPrimary)?.googleDriveUrl ||
          images[0]?.googleDriveUrl ||
          (p as any).primaryImage ||
          null;

        const origPrice = Number(p.price);
        const sellPrice = p.discountPrice ? Number(p.discountPrice) : origPrice;
        const discountPct =
          p.discountPercentage !== null && p.discountPercentage !== undefined
            ? p.discountPercentage
            : origPrice > 0 && sellPrice < origPrice
            ? Math.max(0, Math.round(((origPrice - sellPrice) / origPrice) * 100))
            : 0;

        const normName = p.name ? p.name.toLowerCase().trim() : '';
        const prodPol =
          productPolicies[p.id] ||
          productPolicies[normName] ||
          (p.slug ? productPolicies[p.slug] : null) ||
          Object.entries(productPolicies).find(([k, v]: any) => {
            return (
              k === p.id ||
              v.id === p.id ||
              (v.name && v.name.toLowerCase().trim() === normName)
            );
          })?.[1];

        const provPol = p.providerId ? providerPolicies[p.providerId] : null;

        // Strict priority: product override > provider override > default true
        let allowCod = true;
        if (prodPol && prodPol.allowCod !== undefined) {
          allowCod = prodPol.allowCod;
        } else if (provPol && provPol.allowCod !== undefined) {
          allowCod = provPol.allowCod;
        }

        let allowReturn = true;
        if (prodPol && prodPol.allowReturn !== undefined) {
          allowReturn = prodPol.allowReturn;
        } else if (provPol && provPol.allowReturn !== undefined) {
          allowReturn = provPol.allowReturn;
        }

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: origPrice,
          originalPrice: origPrice,
          discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
          sellingPrice: sellPrice,
          discountPercentage: discountPct,
          subcategory: p.subcategory || null,
          dietaryType: p.dietaryType || 'Not Applicable',
          isPopular: Boolean(p.isPopular),
          tags: p.tags || '',
          deliveryType: p.deliveryType || '10-15 mins',
          unit: p.unit,
          stock: p.stock,
          availability: p.availability !== undefined ? p.availability : true,
          isLowStock: p.stock <= (p.lowStockThreshold || 5) && p.stock > 0,
          isOutOfStock: p.stock <= 0 || p.availability === false,
          isFeatured: p.isFeatured,
          availableToday: p.availableToday !== undefined ? p.availableToday : true,
          category: p.category,
          providerId: p.providerId || null,
          allowCod,
          allowReturn,
          primaryImage,
          images,
          rating: Number(avgRating.toFixed(1)),
          reviewsCount: reviews.length
        };
      });

      let finalTotal = total;

      // Fail-safe: If database returned 0 products (e.g. unseeded production database), serve fallback catalog
      if (formattedProducts.length === 0) {
        let fallbacks = [...fallbackProducts];

        if (category) {
          fallbacks = fallbacks.filter(
            (p) => p.categoryId === `cat_${category}` || (p as any).category?.slug === category
          );
        }

        if (search) {
          const q = (search as string).toLowerCase().trim();
          fallbacks = fallbacks.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.description && p.description.toLowerCase().includes(q)) ||
              (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
              (p.tags && p.tags.toLowerCase().includes(q))
          );
        }

        if (featured === 'true') {
          fallbacks = fallbacks.filter((p) => p.isFeatured);
        }

        if (inStockOnly === 'true') {
          fallbacks = fallbacks.filter((p) => p.stock > 0);
        }

        if (minPrice) {
          fallbacks = fallbacks.filter((p) => Number(p.price) >= parseFloat(minPrice as string));
        }

        if (maxPrice) {
          fallbacks = fallbacks.filter((p) => Number(p.price) <= parseFloat(maxPrice as string));
        }

        finalTotal = fallbacks.length;
        const pagedFallbacks = fallbacks.slice(skip, skip + limitNum);

        formattedProducts = pagedFallbacks.map((p) => {
          const cat = fallbackCategories.find((c) => c.id === p.categoryId);
          const images = p.images || [];
          const primaryImage = (p as any).image || images[0]?.googleDriveUrl || (p as any).primaryImage || null;
          const origPrice = Number(p.price);
          const sellPrice = p.discountPrice ? Number(p.discountPrice) : origPrice;
          const discountPct =
            p.discountPercentage !== null && p.discountPercentage !== undefined
              ? p.discountPercentage
              : origPrice > 0 && sellPrice < origPrice
              ? Math.max(0, Math.round(((origPrice - sellPrice) / origPrice) * 100))
              : 0;

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: origPrice,
            originalPrice: origPrice,
            discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
            sellingPrice: sellPrice,
            discountPercentage: discountPct,
            subcategory: p.subcategory || null,
            dietaryType: p.dietaryType || 'Not Applicable',
            isPopular: Boolean(p.isPopular),
            tags: p.tags || '',
            deliveryType: (p as any).deliveryType || (p as any).deliveryTime || '10-15 mins',
            unit: p.unit,
            stock: p.stock,
            availability: p.availability !== undefined ? p.availability : true,
            isLowStock: p.stock <= (p.lowStockThreshold || 5) && p.stock > 0,
            isOutOfStock: p.stock <= 0 || p.availability === false,
            isFeatured: p.isFeatured,
            availableToday: true,
            category: cat || { id: p.categoryId, name: 'Food & Meals', slug: (category as string) || 'food' },
            primaryImage,
            images,
            rating: 4.8,
            reviewsCount: 12
          };
        });
      }

      res.status(200).json({
        success: true,
        data: formattedProducts,
        pagination: {
          total: finalTotal,
          page: pageNum,
          totalPages: Math.ceil(finalTotal / limitNum),
          limit: limitNum
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single product by slug
   */
  public static async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          images: true,
          inventory: true,
          reviews: {
            where: { isHidden: false },
            include: {
              student: {
                select: { fullName: true, hall: { select: { name: true } } }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!product) {
        // Fail-safe check in fallback catalog
        const fallback = fallbackProducts.find((p) => p.slug === slug || p.id === slug);
        if (fallback) {
          const cat = fallbackCategories.find((c) => c.id === fallback.categoryId);
          const images = fallback.images || [];
          const primaryImage = images[0]?.googleDriveUrl || (fallback as any).primaryImage || null;
          res.status(200).json({
            success: true,
            product: {
              ...fallback,
              price: Number(fallback.price),
              discountPrice: fallback.discountPrice ? Number(fallback.discountPrice) : null,
              category: cat,
              primaryImage,
              rating: 4.8,
              reviewsCount: 15,
              reviews: []
            }
          });
          return;
        }

        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      const reviews = product.reviews || [];
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
          : 5.0;

      const images = product.images || [];
      const primaryImage =
        images.find((img) => img.isPrimary)?.googleDriveUrl ||
        images[0]?.googleDriveUrl ||
        (product as any).primaryImage ||
        null;

      let productPolicies: Record<string, any> = {};
      let providerPolicies: Record<string, any> = {};
      try {
        const polSettings = await prisma.adminSetting.findMany({
          where: { key: { in: ['PRODUCT_ORDER_POLICIES', 'PROVIDER_ORDER_POLICIES'] } }
        });
        const prodPolSetting = polSettings.find((s) => s.key === 'PRODUCT_ORDER_POLICIES');
        const provPolSetting = polSettings.find((s) => s.key === 'PROVIDER_ORDER_POLICIES');
        if (prodPolSetting?.value) productPolicies = JSON.parse(prodPolSetting.value);
        if (provPolSetting?.value) providerPolicies = JSON.parse(provPolSetting.value);
      } catch {}

      const normName = product.name ? product.name.toLowerCase().trim() : '';
      const prodPol =
        productPolicies[product.id] ||
        productPolicies[normName] ||
        (product.slug ? productPolicies[product.slug] : null) ||
        Object.entries(productPolicies).find(([k, v]: any) => {
          return (
            k === product.id ||
            v.id === product.id ||
            (v.name && v.name.toLowerCase().trim() === normName)
          );
        })?.[1];

      const provPol = product.providerId ? providerPolicies[product.providerId] : null;

      let allowCod = true;
      if (prodPol && prodPol.allowCod !== undefined) {
        allowCod = prodPol.allowCod;
      } else if (provPol && provPol.allowCod !== undefined) {
        allowCod = provPol.allowCod;
      }

      let allowReturn = true;
      if (prodPol && prodPol.allowReturn !== undefined) {
        allowReturn = prodPol.allowReturn;
      } else if (provPol && provPol.allowReturn !== undefined) {
        allowReturn = provPol.allowReturn;
      }

      res.status(200).json({
        success: true,
        product: {
          ...product,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          isLowStock: product.stock <= (product.lowStockThreshold || 5) && product.stock > 0,
          isOutOfStock: product.stock <= 0,
          providerId: product.providerId || null,
          allowCod,
          allowReturn,
          primaryImage,
          images,
          rating: Number(avgRating.toFixed(1)),
          reviewsCount: reviews.length
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public Order Policies & Platform Checkout Settings
   * Open to students, guests, and web/mobile apps without requiring ADMIN role
   */
  public static async getOrderPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await prisma.adminSetting.findMany({
        where: {
          key: {
            in: [
              'ENABLE_CASH_ON_DELIVERY',
              'MAX_COD_AMOUNT',
              'COD_MIN_ADVANCE_AMOUNT',
              'PRODUCT_ORDER_POLICIES',
              'PROVIDER_ORDER_POLICIES',
              'CANCELLATION_CUTOFF_STAGE',
              'RETURN_POLICY_FOOD',
              'RETURN_POLICY_PRODUCE',
              'RETURN_POLICY_STATIONERY'
            ]
          }
        }
      });

      const settingMap: Record<string, string> = {};
      settings.forEach((s) => { settingMap[s.key] = s.value; });

      let productPolicies: Record<string, any> = {};
      let providerPolicies: Record<string, any> = {};

      try {
        if (settingMap['PRODUCT_ORDER_POLICIES']) {
          productPolicies = JSON.parse(settingMap['PRODUCT_ORDER_POLICIES']);
        }
      } catch {}

      try {
        if (settingMap['PROVIDER_ORDER_POLICIES']) {
          providerPolicies = JSON.parse(settingMap['PROVIDER_ORDER_POLICIES']);
        }
      } catch {}

      res.status(200).json({
        success: true,
        isCodGloballyEnabled: settingMap['ENABLE_CASH_ON_DELIVERY'] !== 'false',
        maxCodAmount: Number(settingMap['MAX_COD_AMOUNT']) || 1500,
        codMinAdvanceAmount: Number(settingMap['COD_MIN_ADVANCE_AMOUNT']) || 10,
        cancellationCutoffStage: settingMap['CANCELLATION_CUTOFF_STAGE'] || 'ACCEPTED',
        returnPolicyFood: settingMap['RETURN_POLICY_FOOD'] || 'RESTRICTED',
        returnPolicyProduce: settingMap['RETURN_POLICY_PRODUCE'] || 'FRESHNESS_VERIFIED',
        returnPolicyStationery: settingMap['RETURN_POLICY_STATIONERY'] || 'ALLOWED_24HR',
        productPolicies,
        providerPolicies
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Dynamic categories list
   */
  public static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { displayOrder: 'asc' }
      });

      if (categories.length === 0) {
        res.status(200).json({
          success: true,
          categories: fallbackCategories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            image: null,
            productsCount: fallbackProducts.filter((p) => p.categoryId === c.id).length
          }))
        });
        return;
      }

      res.status(200).json({
        success: true,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          image: c.image,
          productsCount: c._count?.products || 0
        }))
      });
    } catch (err) {
      next(err);
    }
  }
}
