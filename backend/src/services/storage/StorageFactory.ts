import { IStorageService } from './IStorageService';
import { GoogleDriveStorageService } from './GoogleDriveStorageService';

let storageInstance: IStorageService | null = null;

export class StorageFactory {
  public static getStorageService(): IStorageService {
    if (!storageInstance) {
      storageInstance = new GoogleDriveStorageService();
    }
    return storageInstance;
  }
}
