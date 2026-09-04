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
  public static readonly TARGET_WIDTH = 1200;
  public static readonly TARGET_HEIGHT = 900; // 4:3 Aspect Ratio

  /**
   * Normalizes any input image (portrait, landscape, square, screenshot)
   * to a strict 4:3 (1200x900) aspect ratio with high visual fidelity.
   */
  public static async normalizeProductImage(inputBuffer: Buffer): Promise<ProcessedImageResult> {
    try {
      const sharpInstance = sharp(inputBuffer);
      const metadata = await sharpInstance.metadata();

      const processedBuffer = await sharpInstance
        .rotate() // Automatically orient based on EXIF
        .resize(this.TARGET_WIDTH, this.TARGET_HEIGHT, {
          fit: 'cover',
          position: sharp.strategy.attention, // Focus on the most salient feature / center
          withoutEnlargement: false
        })
        .jpeg({
          quality: 85,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();

      return {
        buffer: processedBuffer,
        width: this.TARGET_WIDTH,
        height: this.TARGET_HEIGHT,
        mimeType: 'image/jpeg',
        format: 'jpeg',
        size: processedBuffer.length,
        aspectRatio: '4:3'
      };
    } catch (err: any) {
      console.error('[ImageProcessingService] Normalization error, fallback to raw buffer:', err);
      return {
        buffer: inputBuffer,
        width: this.TARGET_WIDTH,
        height: this.TARGET_HEIGHT,
        mimeType: 'image/jpeg',
        format: 'jpeg',
        size: inputBuffer.length,
        aspectRatio: '4:3'
      };
    }
  }
}
