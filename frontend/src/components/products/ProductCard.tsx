'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CartItem, Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Plus, Minus, Heart, Zap, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity, showToast } = useCart();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  // Check initial favorite state from localStorage
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('campus_basket_favorites') || '[]');
      if (Array.isArray(favs) && favs.includes(product.id)) {
        setIsFavorite(true);
      }
    } catch {}
  }, [product.id]);

  // Check if item is already in cart
  const cartItem = items?.find((i: CartItem) => i.productId === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;

    addItem(product, 1);
    showToast(`✓ Added to basket: ${product.name}`);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantityInCart >= product.stock) return;
    updateQuantity(product.id, quantityInCart + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, quantityInCart - 1);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const favs = JSON.parse(localStorage.getItem('campus_basket_favorites') || '[]');
      let updatedFavs = Array.isArray(favs) ? favs : [];
      if (nextState) {
        if (!updatedFavs.includes(product.id)) updatedFavs.push(product.id);
        showToast(`Saved to Wishlist: ${product.name}`);
      } else {
        updatedFavs = updatedFavs.filter((id: string) => id !== product.id);
      }
      localStorage.setItem('campus_basket_favorites', JSON.stringify(updatedFavs));
    } catch {}

    if (isAuthenticated) {
      try {
        await apiRequest('/api/campus/favorites/toggle', {
          method: 'POST',
          body: JSON.stringify({ productId: product.id }),
        });
      } catch {}
    }
  };

  const displayImage =
    product.primaryImage ||
    product.images?.[0]?.googleDriveUrl ||
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600';

  const discountPercent =
    product.discountPrice && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : null;

  const isNonVeg = product.name.toLowerCase().includes('chicken') || product.name.toLowerCase().includes('egg');
  const categoryLabel = product.category?.name || (product.category?.slug === 'food' ? 'Food & Meals' : product.category?.slug === 'fruits' ? 'Fresh Produce' : 'Stationery');

  return (
    <div className="bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-2xl overflow-hidden p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-md group relative">
      {/* Top action row: Favorite & subtle tag */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          {product.category?.slug === 'food' && (
            <div className={isNonVeg ? 'non-veg-icon' : 'veg-icon'} title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'} />
          )}
          <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide truncate max-w-[120px]">
            {categoryLabel}
          </span>
        </div>

        <button
          onClick={handleToggleFavorite}
          className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-50 transition-colors"
          title="Save to favorites"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="h-28 sm:h-32 w-full bg-[#F7F8F6] rounded-xl overflow-hidden flex items-center justify-center p-2 relative">
          <img
            src={displayImage}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-104 transition-transform duration-200"
            loading="lazy"
          />
          {/* Subtle delivery time tag */}
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-white/95 backdrop-blur-xs text-[#172033] px-1.5 py-0.5 rounded text-[9.5px] font-bold shadow-2xs border border-gray-100">
            <Zap className="w-2.5 h-2.5 text-[#4F9D2F] fill-[#4F9D2F]" />
            <span>10–15 min</span>
          </div>
        </div>
      </Link>

      {/* Product Details */}
      <div className="mt-2.5 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-bold text-xs sm:text-sm text-[#172033] leading-snug line-clamp-1 hover:text-[#4F9D2F] transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
            {product.description || `1 ${product.unit} • Campus Cafeteria`}
          </p>
        </div>

        {/* Price & Quantity Controls */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-black text-[#172033]">
                ₹{product.discountPrice || product.price}
              </span>
              {product.discountPrice && (
                <span className="text-[10px] text-gray-400 line-through">
                  ₹{product.price}
                </span>
              )}
            </div>
            {discountPercent && (
              <span className="text-[10px] font-bold text-[#4F9D2F]">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Stepper / Add CTA */}
          {quantityInCart === 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="px-3 py-1.5 rounded-lg border border-[#4F9D2F] text-[#4F9D2F] hover:bg-[#4F9D2F] hover:text-white font-bold text-xs transition-all active:scale-95 disabled:border-gray-200 disabled:text-gray-300 shadow-2xs cursor-pointer"
            >
              + Add
            </button>
          ) : (
            <div className="flex items-center rounded-lg bg-[#4F9D2F] text-white overflow-hidden shadow-2xs">
              <button
                onClick={handleDecrement}
                className="px-2 py-1 hover:bg-[#36751F] transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3 stroke-[2.5]" />
              </button>
              <span className="px-2 font-black text-xs min-w-[20px] text-center">
                {quantityInCart}
              </span>
              <button
                onClick={handleIncrement}
                disabled={quantityInCart >= product.stock}
                className="px-2 py-1 hover:bg-[#36751F] transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
