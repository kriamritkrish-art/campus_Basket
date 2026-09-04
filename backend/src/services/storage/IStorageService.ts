import { Readable } from 'stream';

export interface UploadResult {
  fileId: string;
  webUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface IStorageService {
  /**
   * Uploads a file buffer to storage under a folder hierarchy
   */
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderCategory: 'Food' | 'Fruits' | 'Essentials' | 'Laundry' | 'Receipts' | 'General'
  ): Promise<UploadResult>;

  /**
   * Deletes a file from storage by its ID
   */
  deleteFile(fileId: string): Promise<boolean>;

  /**
   * Obtains a direct or proxy streaming URL for an image
   */
  getFileUrl(fileId: string): string;

  /**
   * Reads the file stream for secure backend proxy delivery
   */
  getFileStream(fileId: string): Promise<{ stream: Readable; mimeType: string; fileName: string }>;
}
