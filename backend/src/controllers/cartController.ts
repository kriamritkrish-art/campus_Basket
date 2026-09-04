import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export class CartController {
  /**
   * Get student's current cart with server-verified prices & current stock
   */
  public static async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        res.status(403).json({ success: false, message: 'Student profile required' });
        return;
      }

      let cart = await prisma.cart.findUnique({
        where: { studentId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                  category: true
                }
              }
            }
          }
        }
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { studentId },
          include: {
            items: {
              include: {
                product: {
                  include: { images: true, category: true }
                }
              }
            }
          }
        });
      }

      // Strictly recalculate totals from source-of-truth products table
      let subtotal = 0;
      const formattedItems = cart.items.map((item) => {
        const product = item.product;
        const currentPrice = product.discountPrice ? Number(product.discountPrice) : Number(product.price);
        const itemTotal = currentPrice * item.quantity;
        subtotal += itemTotal;

        return {
          id: item.id,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          unitPrice: currentPrice,
          originalPrice: Number(product.price),
          quantity: item.quantity,
          itemTotal,
          stock: product.stock,
          isOutOfStock: product.stock <= 0,
          isAvailable: product.availability && product.availableToday,
          unit: product.unit,
          image: product.images.find((img) => img.isPrimary)?.googleDriveUrl || product.images[0]?.googleDriveUrl || null
        };
      });

      // Standard campus delivery fee (Admin configurable, default ₹15 or free above ₹250)
      const deliveryFee = subtotal > 250 || subtotal === 0 ? 0 : 15;
      const total = subtotal + deliveryFee;

      res.status(200).json({
        success: true,
        cart: {
          id: cart.id,
          items: formattedItems,
          subtotal,
          deliveryFee,
          total,
          itemCount: formattedItems.reduce((acc, i) => acc + i.quantity, 0)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add item to cart
   */
  public static async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;
      const { productId, quantity = 1 } = req.body;

      if (!studentId) {
        res.status(403).json({ success: false, message: 'Student profile required' });
        return;
      }

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product || !product.availability) {
        res.status(404).json({ success: false, message: 'Product is currently unavailable' });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit(s) available in campus inventory`
        });
        return;
      }

      let cart = await prisma.cart.findUnique({ where: { studentId } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { studentId } });
      }

      const effectivePrice = product.discountPrice ? product.discountPrice : product.price;

      // Upsert cart item
      await prisma.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        },
        update: {
          quantity: { increment: quantity },
          unitPrice: effectivePrice
        },
        create: {
          cartId: cart.id,
          productId,
          quantity,
          unitPrice: effectivePrice
        }
      });

      res.status(200).json({
        success: true,
        message: `${product.name} added to your cart`
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update item quantity
   */
  public static async updateQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;
      const { id } = req.params;
      const { quantity } = req.body;

      if (!studentId) {
        res.status(403).json({ success: false, message: 'Student profile required' });
        return;
      }

      if (quantity <= 0) {
        await prisma.cartItem.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Item removed from cart' });
        return;
      }

      const cartItem = await prisma.cartItem.findUnique({
        where: { id },
        include: { product: true }
      });

      if (!cartItem) {
        res.status(404).json({ success: false, message: 'Item not found in cart' });
        return;
      }

      if (cartItem.product.stock < quantity) {
        res.status(400).json({
          success: false,
          message: `Only ${cartItem.product.stock} units available in stock`
        });
        return;
      }

      await prisma.cartItem.update({
        where: { id },
        data: { quantity }
      });

      res.status(200).json({ success: true, message: 'Cart updated' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove item from cart
   */
  public static async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.cartItem.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Item removed from cart' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Clear cart
   */
  public static async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.studentId;
      if (studentId) {
        const cart = await prisma.cart.findUnique({ where: { studentId } });
        if (cart) {
          await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }
      res.status(200).json({ success: true, message: 'Cart cleared' });
    } catch (err) {
      next(err);
    }
  }
}
