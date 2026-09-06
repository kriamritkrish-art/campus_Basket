'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '../../../lib/api';
import { Product } from '../../../types';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Star,
  Plus,
  Minus,
  Check,
  Heart,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Truck
} from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await apiRequest(`/api/products/${slug}`);
        if (res.success && res.product) {
          setProduct(res.product);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !isAuthenticated) return;

    setReviewSubmitting(true);
    setReviewMsg(null);

    try {
      const res = await apiRequest('/api/campus/reviews', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (res.success) {
        setReviewMsg('Thank you! Your verified review has been submitted.');
        setReviewComment('');
      } else {
        setReviewMsg(res.message || 'Could not post review.');
      }
    } catch (err: any) {
      setReviewMsg(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="glass-panel h-96 rounded-3xl animate-shimmer" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        <h2 className="text-xl font-bold text-white">Product not found</h2>
        <p className="text-xs mt-2">The requested campus item may be unavailable or moved.</p>
        <Link href="/" className="mt-4 inline-block px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const displayImage =
    product.primaryImage ||
    product.images?.[0]?.googleDriveUrl ||
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800';

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-24 sm:pb-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#689f38] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      {/* Main Showcase */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-start">
        {/* Image Display */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 aspect-square flex items-center justify-center p-4">
          <img src={displayImage} alt={product.name} className="max-h-full max-w-full object-contain" />

          {product.category && (
            <span className="absolute top-3 left-3 bg-[#f1f8e9] text-xs font-bold text-[#2e7d32] px-3 py-1 rounded-full border border-[#dcedc8] shadow-xs">
              {product.category.name}
            </span>
          )}

          {product.isOutOfStock ? (
            <span className="absolute bottom-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-xs">
              Out of Stock
            </span>
          ) : product.isLowStock ? (
            <span className="absolute bottom-3 left-3 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock ({product.stock} left)
            </span>
          ) : null}
        </div>

        {/* Product Details & Purchase Form */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <div className="flex items-center gap-2 text-amber-500 text-xs sm:text-sm font-bold mb-2">
              <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{product.rating > 0 ? product.rating.toFixed(1) : '4.8'}</span>
              </div>
              <span className="text-gray-400 font-normal">({product.reviewsCount || 12} student ratings)</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-gray-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mt-2 sm:mt-3">
              <span className="text-2xl sm:text-3xl font-black text-[#212121]">
                ₹{product.discountPrice || product.price}
              </span>
              {product.discountPrice && (
                <span className="text-sm sm:text-base text-gray-400 line-through">₹{product.price}</span>
              )}
              <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2.5 py-0.5 rounded-md">
                1 {product.unit}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-b border-gray-100 py-3 sm:py-4">
            {product.description}
          </p>

          {/* Delivery Details */}
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2 text-gray-700">
              <Truck className="w-4 h-4 text-[#689f38]" />
              <span>Room delivery to Halls 1–14, MTH &amp; SNH within 10–20 minutes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <ShieldCheck className="w-4 h-4 text-[#2e7d32]" />
              <span>Verified student hygiene and freshness guarantee</span>
            </div>
          </div>

          {/* Quantity and Add to Cart (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-4 pt-2">
            <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-700 hover:text-black rounded-lg hover:bg-white transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-gray-900 text-sm font-mono">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-700 hover:text-black rounded-lg hover:bg-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.isOutOfStock}
              className={`flex-1 py-3 px-6 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                product.isOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : added
                  ? 'bg-[#2e7d32] text-white'
                  : 'bg-[#689f38] hover:bg-[#5b8c30] text-white'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Added to Basket
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add to Basket (₹{((product.discountPrice || product.price) * qty).toFixed(0)})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <div className="bg-white p-5 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4 sm:space-y-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Student Reviews &amp; Ratings</h3>

        {/* Review Form for Verified Student */}
        {isAuthenticated ? (
          <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Leave a Verified Campus Review
            </h4>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-1 text-amber-400"
                >
                  <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Share your feedback on taste, freshness, and hostel delivery speed..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#689f38]"
            />

            {reviewMsg && <p className="text-xs text-[#2e7d32] font-semibold">{reviewMsg}</p>}

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-4 py-2 bg-[#689f38] hover:bg-[#5b8c30] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
            >
              {reviewSubmitting ? 'Posting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-600">
            <Link href="/login" className="text-[#2e7d32] font-bold underline">
              Login with your @nitdgp.ac.in email
            </Link>{' '}
            to submit a product rating.
          </div>
        )}
      </div>

      {/* Mobile Sticky Add to Basket Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-lg z-40 flex items-center justify-between pb-safe">
        <div>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Price</div>
          <div className="text-xl font-black text-gray-900">
            ₹{((product.discountPrice || product.price) * qty).toFixed(0)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 h-9">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-7 h-full flex items-center justify-center text-gray-700 hover:text-black font-bold"
            >
              -
            </button>
            <span className="w-7 text-center font-bold text-gray-900 text-xs">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-7 h-full flex items-center justify-center text-gray-700 hover:text-black font-bold"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.isOutOfStock}
            className={`py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
              product.isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : added
                ? 'bg-[#2e7d32] text-white'
                : 'bg-[#689f38] hover:bg-[#5b8c30] text-white'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
