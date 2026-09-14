import { getApiBase } from './api';

/**
 * Returns an ultra-high quality, CDN-optimized image URL with proper fallback.
 * Fixes Google Drive thumbnail sizing and avoids downscaled or blurry rendering.
 */
export function getOptimizedImageUrl(rawUrl?: string | null, fallback?: string): string {
  const defaultFallback = fallback || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200';
  if (!rawUrl || typeof rawUrl !== 'string') return defaultFallback;
  const trimmed = rawUrl.trim();

  // If local API proxy path, ensure host is prepended
  if (trimmed.startsWith('/api/')) {
    const base = getApiBase();
    const cleanBase = base ? base.replace(/\/+$/, '') : '';
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
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

/**
 * Provides an alternate high-definition fallback URL if the primary image host experiences CORS/network limits.
 */
export function getGoogleDriveFallbackUrl(currentUrl: string): string | null {
  if (!currentUrl || typeof currentUrl !== 'string') return null;
  const driveMatch =
    currentUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    currentUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    currentUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    if (currentUrl.includes('googleusercontent.com')) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2048`;
    }
    return `https://lh3.googleusercontent.com/d/${fileId}=s2048`;
  }
  return null;
}

