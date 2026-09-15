import { getApiBase } from './api';

/**
 * Returns an ultra-high quality, CDN-optimized image URL with proper fallback.
 * Fixes Google Drive thumbnail sizing and avoids downscaled or blurry rendering.
 */
export function getOptimizedImageUrl(rawUrl?: string | null, fallback?: string): string {
  const defaultFallback = fallback || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200';
  if (!rawUrl || typeof rawUrl !== 'string') return defaultFallback;
  const trimmed = rawUrl.trim();

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // Backend-served asset paths need the API host when the frontend is deployed separately.
  if (
    trimmed.startsWith('/api/') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/storage_uploads/')
  ) {
    const base = getApiBase();
    const cleanBase = base ? base.replace(/\/+$/, '') : '';
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

    // Browser deployments proxy /api through Next so CSP and same-origin rules
    // do not block images from the backend service.
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return cleanPath;
    }

    return cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;
  }

  // Google Drive & Google User Content matching
  const driveMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    // High-resolution Google Drive CDN endpoint (s2048 preserves native high-fidelity)
    return `https://lh3.googleusercontent.com/d/${fileId}=s2048`;
  }

  return trimmed;
}

export function getProductImageUrl(product: any, fallback?: string): string {
  const firstImage = Array.isArray(product?.images) ? product.images[0] : null;
  const rawImage =
    product?.image ||
    product?.primaryImage ||
    product?.imageUrl ||
    firstImage?.googleDriveUrl ||
    firstImage?.url ||
    firstImage?.webUrl ||
    (typeof firstImage === 'string' ? firstImage : null);

  return getOptimizedImageUrl(rawImage, fallback);
}

/**
 * Provides an alternate high-definition fallback URL if the primary image host experiences CORS/network limits.
 */
export function getGoogleDriveFallbackUrl(currentUrl: string): string | null {
  if (!currentUrl || typeof currentUrl !== 'string') return null;
  const driveMatch =
    currentUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    currentUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    currentUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/) ||
    currentUrl.match(/\/api\/images\/preview\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    const base = getApiBase();
    const cleanBase = base ? base.replace(/\/+$/, '') : '';
    const proxyUrl = `${cleanBase}/api/images/preview/${fileId}`;

    if (!currentUrl.includes('/api/images/preview/')) {
      return proxyUrl;
    }
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }
  return null;
}

