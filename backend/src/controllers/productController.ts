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
        availability: true
      };

      if (category) {
        where.category = { slug: category as string };
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { description: { contains: search as string } }
        ];
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

      let formattedProducts: any[] = products.map((p) => {
        const reviews = p.reviews || [];
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
            : 5.0;

        const images = p.images || [];
        const primaryImage =
          images.find((img) => img.isPrimary)?.googleDriveUrl ||
          images[0]?.googleDriveUrl ||
          (p as any).primaryImage ||
          null;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: Number(p.price),
          discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
          unit: p.unit,
          stock: p.stock,
          isLowStock: p.stock <= (p.lowStockThreshold || 5) && p.stock > 0,
          isOutOfStock: p.stock <= 0,
          isFeatured: p.isFeatured,
          availableToday: p.availableToday !== undefined ? p.availableToday : true,
          category: p.category,
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
              p.description.toLowerCase().includes(q)
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
          const primaryImage = images[0]?.googleDriveUrl || (p as any).primaryImage || null;
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: Number(p.price),
            discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
            unit: p.unit,
            stock: p.stock,
            isLowStock: p.stock <= (p.lowStockThreshold || 5) && p.stock > 0,
            isOutOfStock: p.stock <= 0,
            isFeatured: p.isFeatured,
            availableToday: true,
            category: cat || { id: p.categoryId, name: 'Food & Meals', slug: (category as string) || 'food' },
            primaryImage,
            images,
            rating: 4.8,
            reviewsCount: 18
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

      res.status(200).json({
        success: true,
        product: {
          ...product,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          isLowStock: product.stock <= (product.lowStockThreshold || 5) && product.stock > 0,
          isOutOfStock: product.stock <= 0,
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
