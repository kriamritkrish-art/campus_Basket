import { Request, Response, NextFunction } from 'express';
import { StorageFactory } from '../services/storage/StorageFactory';

const storageService = StorageFactory.getStorageService();

export class ImageController {
  /**
   * Secure backend streaming proxy for Google Drive media.
   * Feeds the image binary to client without exposing Google Service Account secrets.
   */
  public static async previewImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileId } = req.params;

      const { stream, mimeType, fileName } = await storageService.getFileStream(fileId);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24hr cache for performance

      stream.pipe(res);
    } catch (err: any) {
      // Return a graceful SVG placeholder for local preview when file is not found
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="#0f172a">
          <rect width="400" height="300" fill="#1e293b"/>
          <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="20">NIT Durgapur Campus</text>
          <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Google Drive Asset</text>
        </svg>
      `);
    }
  }
}
