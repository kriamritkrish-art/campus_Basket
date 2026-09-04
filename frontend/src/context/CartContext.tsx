'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { apiRequest } from '../lib/api';

interface CartContextType {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  appliedCoupon: string | null;
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  discountAmount: 0,
  total: 0,
  appliedCoupon: null,
  itemCount: 0,
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  applyCoupon: async () => ({ success: false, message: '' }),
  removeCoupon: () => {},
  isCartOpen: false,
  setIsCartOpen: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('nit_cart_items');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch {
        // Ignored
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('nit_cart_items', JSON.stringify(items));
  }, [items]);

  const subtotal = items.reduce((sum, i) => sum + i.itemTotal, 0);
  const deliveryFee = subtotal > 250 || subtotal === 0 ? 0 : 15;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const addItem = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      const effectivePrice = product.discountPrice ? product.discountPrice : product.price;

      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: i.quantity + quantity,
                itemTotal: (i.quantity + quantity) * i.unitPrice,
              }
            : i
        );
      }

      const newItem: CartItem = {
        id: `client_${Date.now()}_${product.id}`,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        unitPrice: effectivePrice,
        originalPrice: product.price,
        quantity,
        itemTotal: effectivePrice * quantity,
        stock: product.stock,
        isOutOfStock: product.stock <= 0,
        unit: product.unit,
        image: product.primaryImage || null,
      };

      return [...prev, newItem];
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              quantity,
              itemTotal: quantity * i.unitPrice,
            }
          : i
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    localStorage.removeItem('nit_cart_items');
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiRequest('/api/campus/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });

      if (res.success && res.discount !== undefined) {
        setAppliedCoupon(code.toUpperCase());
        setDiscountAmount(res.discount);
        return { success: true, message: `Coupon applied! Saved ₹${res.discount}` };
      }
      return { success: false, message: res.message || 'Invalid coupon' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        deliveryFee,
        discountAmount,
        total,
        appliedCoupon,
        itemCount,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
