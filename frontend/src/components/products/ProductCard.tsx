'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CartItem, Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Star, Plus, Minus, Check, Heart, Zap, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity, showToast } = useCart();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddedAnim, setIsAddedAnim] = useState(false);

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
    setIsAddedAnim(true);
    setTimeout(() => setIsAddedAnim(false), 800);
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

    // Persist in localStorage
    try {
      const favs = JSON.parse(localStorage.getItem('campus_basket_favorites') || '[]');
      let updatedFavs = Array.isArray(favs) ? favs : [];
      if (nextState) {
        if (!updatedFavs.includes(product.id)) updatedFavs.push(product.id);
        showToast(`Saved "${product.name}" to your Wishlist`);
      } else {
        updatedFavs = updatedFavs.filter((id: string) => id !== product.id);
        showToast(`Removed from Wishlist`);
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

  // Calculate discount percent
  const discountPercent =
    product.discountPrice && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : null;

  // Determine if veg or non-veg (Chicken biryani or egg curry is non-veg)
  const isNonVeg = product.name.toLowerCase().includes('chicken') || product.name.toLowerCase().includes('egg');

  // Vendor brand name
  const vendorBrand = product.category?.slug === 'food' ? 'canteen!' : product.category?.slug === 'fruits' ? 'fresho!' : 'campus essentials!';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative p-2.5 sm:p-3">
      {/* Top Left: BigBasket Green Discount Badge */}
      {discountPercent && (
        <div className="absolute top-0 left-0 bg-[#689f38] text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-br-lg shadow-xs z-10 uppercase tracking-wider">
          {discountPercent}% OFF
        </div>
      )}

      {/* Top Right: Favorite Heart */}
      <button
        onClick={handleToggleFavorite}
        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors z-10"
        title="Save to Favorites"
      >
        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      {/* Image & Veg Marker */}
      <Link href={`/products/${product.slug}`} className="block relative pt-2">
        <div className="h-32 sm:h-36 md:h-40 w-full overflow-hidden flex items-center justify-center bg-white rounded-lg">
          <img
            src={displayImage}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Veg / Non-Veg Indicator Icon (BigBasket style bottom-left of image) */}
        <div className="flex items-center justify-between mt-1.5">
          {product.category?.slug === 'food' ? (
            <div className={isNonVeg ? 'non-veg-icon' : 'veg-icon'} title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'} />
          ) : product.category?.slug === 'fruits' ? (
            <div className="veg-icon" title="100% Fresh Farm Produce" />
          ) : (
            <div className="w-3.5 h-3.5" />
          )}

          {/* ⚡ 10 MINS Delivery Badge */}
          <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-bold text-[#2e7d32] bg-[#f1f8e9] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#dcedc8]">
            <Zap className="w-2.5 h-2.5 fill-[#2e7d32]" />
            <span>10 MINS</span>
          </div>
        </div>
      </Link>

      {/* Product Content Details */}
      <div className="mt-1.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand/Vendor Tag */}
          <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
            {vendorBrand}
          </div>

          {/* Title */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 hover:text-[#689f38] transition-colors mt-0.5 min-h-[30px] sm:min-h-[36px]">
              {product.name}
            </h3>
          </Link>

          {/* Variant / Unit Dropdown Selector Box */}
          <div className="mt-1.5 inline-flex items-center justify-between w-full px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-gray-50 border border-gray-200 text-[10px] sm:text-[11px] text-gray-700 font-medium truncate">
            <span className="truncate">1 {product.unit}</span>
            <span className="text-gray-400 text-[9px] ml-1 shrink-0">▼</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] text-gray-500">
            <div className="flex items-center gap-0.5 bg-[#f1f8e9] text-[#2e7d32] px-1 sm:px-1.5 py-0.5 rounded font-bold text-[9px] sm:text-[10px]">
              <span>{product.rating > 0 ? product.rating.toFixed(1) : '4.8'}</span>
              <Star className="w-2.5 h-2.5 fill-[#2e7d32]" />
            </div>
            <span className="text-gray-400">({product.reviewsCount || 24})</span>
          </div>
        </div>

        {/* Price & Add to Basket Button */}
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1 sm:gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xs sm:text-base font-extrabold text-[#212121]">
                ₹{product.discountPrice || product.price}
              </span>
              {product.discountPrice && (
                <span className="text-[10px] sm:text-[11px] text-gray-400 line-through">
                  ₹{product.price}
                </span>
              )}
            </div>
            <span className="text-[8.5px] sm:text-[9.5px] text-gray-400 block leading-tight truncate">
              Hostel Delivery
            </span>
          </div>

          {/* ADD / Quantity Counter Button */}
          <div className="shrink-0">
            {quantityInCart > 0 ? (
              <div className="flex items-center bg-[#e53935] text-white rounded-lg overflow-hidden shadow-xs h-7 sm:h-8">
                <button
                  onClick={handleDecrement}
                  className="px-1.5 sm:px-2 h-full hover:bg-[#c62828] transition-colors flex items-center justify-center font-bold text-xs"
                  title="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-1.5 sm:px-2 text-xs font-extrabold min-w-[18px] sm:min-w-[20px] text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={handleIncrement}
                  className="px-1.5 sm:px-2 h-full hover:bg-[#c62828] transition-colors flex items-center justify-center font-bold text-xs"
                  title="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={product.isOutOfStock}
                className={`h-7 sm:h-8 px-2.5 sm:px-4 rounded-lg text-[11px] sm:text-xs font-bold uppercase transition-all shadow-xs flex items-center gap-0.5 sm:gap-1 ${
                  product.isOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-[#e53935] text-[#e53935] hover:bg-[#e53935] hover:text-white active:scale-95'
                }`}
              >
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
