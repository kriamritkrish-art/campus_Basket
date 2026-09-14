import sharp from 'sharp';

export interface ProcessedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
  format: string;
  size: number;
  aspectRatio: string;
}

export class ImageProcessingService {
  public static readonly MAX_DIMENSION = 2560; // Preserve ultra-HD resolution without aggressive downscaling

  /**
   * Normalizes any input image (portrait, landscape, square, transparent PNG, WebP)
   * while strictly preserving native photo quality, sharpness, and high-fidelity colors.
   */
  public static async normalizeProductImage(inputBuffer: Buffer): Promise<ProcessedImageResult> {
    try {
      const sharpInstance = sharp(inputBuffer);
      const metadata = await sharpInstance.metadata();

      const origWidth = metadata.width || 1600;
      const origHeight = metadata.height || 1200;

      // Auto-orient based on EXIF
      let pipeline = sharpInstance.rotate();

      // Only resize if exceeds maximum allowed bounds (e.g. > 2560px) to safeguard memory,
      // without degrading normal/high-res product uploads
      if (origWidth > this.MAX_DIMENSION || origHeight > this.MAX_DIMENSION) {
        pipeline = pipeline.resize(this.MAX_DIMENSION, this.MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      let processedBuffer: Buffer;
      let outputMime = 'image/jpeg';
      let outputFormat = 'jpeg';

      if (metadata.format === 'png') {
        processedBuffer = await pipeline
          .png({ compressionLevel: 8, adaptiveFiltering: true })
          .toBuffer();
        outputMime = 'image/png';
        outputFormat = 'png';
      } else if (metadata.format === 'webp') {
        processedBuffer = await pipeline
          .webp({ quality: 98, lossless: false })
          .toBuffer();
        outputMime = 'image/webp';
        outputFormat = 'webp';
      } else {
        processedBuffer = await pipeline
          .jpeg({
            quality: 98,
            progressive: true,
            mozjpeg: true,
            chromaSubsampling: '4:4:4'
          })
          .toBuffer();
      }

      return {
        buffer: processedBuffer,
        width: origWidth,
        height: origHeight,
        mimeType: outputMime,
        format: outputFormat,
        size: processedBuffer.length,
        aspectRatio: `${origWidth}:${origHeight}`
      };
    } catch (err: any) {
      console.error('[ImageProcessingService] Normalization error, fallback to raw buffer:', err);
      return {
        buffer: inputBuffer,
        width: 1600,
        height: 1200,
        mimeType: 'image/jpeg',
        format: 'jpeg',
        size: inputBuffer.length,
        aspectRatio: '4:3'
      };
    }
  }
}
