export function getOptimizedImageUrl(rawUrl?: string | null, fallback?: string): string {
  const defaultFallback = fallback || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600';
  if (!rawUrl || typeof rawUrl !== 'string') {
    return defaultFallback;
  }

  const trimmed = rawUrl.trim();

  // If it's a Google Drive link, extract file ID
  const driveMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    // Google Drive direct high-resolution CDN link with automatic web caching
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }

  return trimmed;
}

export function getGoogleDriveFallbackUrl(currentUrl: string): string | null {
  const driveMatch =
    currentUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    currentUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    currentUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    if (currentUrl.includes('thumbnail')) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    if (currentUrl.includes('uc?export=view')) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return null;
}
