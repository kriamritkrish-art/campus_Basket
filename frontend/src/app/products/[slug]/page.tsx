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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      {/* Main Showcase */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Image Display */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-square">
          <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />

          {product.category && (
            <span className="absolute top-4 left-4 bg-slate-900/90 text-xs font-semibold text-sky-400 px-3 py-1 rounded-full border border-sky-500/30 backdrop-blur-md">
              {product.category.name}
            </span>
          )}

          {product.isOutOfStock ? (
            <span className="absolute bottom-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-lg">
              Out of Stock
            </span>
          ) : product.isLowStock ? (
            <span className="absolute bottom-4 left-4 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock ({product.stock} left)
            </span>
          ) : null}
        </div>

        {/* Product Details & Purchase Form */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-2">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{product.rating > 0 ? product.rating.toFixed(1) : '5.0'}</span>
              <span className="text-slate-500 font-normal">({product.reviewsCount || 12} student ratings)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-black text-white">
                ₹{product.discountPrice || product.price}
              </span>
              {product.discountPrice && (
                <span className="text-base text-slate-500 line-through">₹{product.price}</span>
              )}
              <span className="text-xs text-slate-400 font-mono uppercase bg-slate-800 px-2.5 py-1 rounded-md">
                per {product.unit}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed border-t border-b border-slate-800 py-4">
            {product.description}
          </p>

          {/* Delivery Details */}
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Room delivery to Halls 1–14, MTH &amp; SNH within 25–40 minutes</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified student hygiene and quality guarantee</span>
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-slate-700"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-white text-sm font-mono">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.isOutOfStock}
              className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                product.isOutOfStock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/25 active:scale-95'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Added to Cart
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add to Order (₹{((product.discountPrice || product.price) * qty).toFixed(0)})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-white">Student Reviews &amp; Feedback</h3>

        {/* Review Form for Verified Student */}
        {isAuthenticated ? (
          <form onSubmit={handleReviewSubmit} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Leave a Verified Campus Review
            </h4>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-1 text-amber-400"
                >
                  <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Share your feedback on quality, freshness, and delivery..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />

            {reviewMsg && <p className="text-xs text-sky-400">{reviewMsg}</p>}

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl"
            >
              {reviewSubmitting ? 'Posting...' : 'Submit Verified Review'}
            </button>
          </form>
        ) : (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
            <Link href="/login" className="text-sky-400 font-semibold underline">
              Login with your @nitdgp.ac.in email
            </Link>{' '}
            to submit a product rating after delivery.
          </div>
        )}
      </div>
    </div>
  );
}
