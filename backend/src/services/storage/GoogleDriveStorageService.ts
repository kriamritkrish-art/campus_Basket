import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/environment';
import { IStorageService, UploadResult } from './IStorageService';

export class GoogleDriveStorageService implements IStorageService {
  private driveClient: drive_v3.Drive | null = null;
  private isConfigured: boolean = false;
  private localFallbackDir: string;

  constructor() {
    this.localFallbackDir = path.resolve(process.cwd(), 'storage_uploads');
    if (!fs.existsSync(this.localFallbackDir)) {
      fs.mkdirSync(this.localFallbackDir, { recursive: true });
    }

    if (env.GOOGLE_DRIVE_REFRESH_TOKEN && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          env.GOOGLE_CLIENT_ID,
          env.GOOGLE_CLIENT_SECRET,
          'https://developers.google.com/oauthplayground'
        );
        oauth2Client.setCredentials({ refresh_token: env.GOOGLE_DRIVE_REFRESH_TOKEN });
        this.driveClient = google.drive({ version: 'v3', auth: oauth2Client });
        this.isConfigured = true;
        console.info('[GoogleDriveStorage] Successfully initialized using User OAuth Refresh Token.');
      } catch (err) {
        console.warn('[GoogleDriveStorage] Failed to initialize OAuth Drive client:', err);
      }
    } else if (env.GOOGLE_DRIVE_CLIENT_EMAIL && env.GOOGLE_DRIVE_PRIVATE_KEY) {
      try {
        const auth = new google.auth.JWT({
          email: env.GOOGLE_DRIVE_CLIENT_EMAIL,
          key: env.GOOGLE_DRIVE_PRIVATE_KEY,
          scopes: ['https://www.googleapis.com/auth/drive']
        });
        this.driveClient = google.drive({ version: 'v3', auth });
        this.isConfigured = true;
        console.info('[GoogleDriveStorage] Successfully initialized using Service Account.');
      } catch (err) {
        console.warn('[GoogleDriveStorage] Failed to initialize Google Drive client:', err);
      }
    } else {
      console.info('[GoogleDriveStorage] Google Drive credentials not set. Running in local sandbox storage mode.');
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderCategory: 'Food' | 'Fruits' | 'Essentials' | 'Laundry' | 'Receipts' | 'General'
  ): Promise<UploadResult> {
    if (this.isConfigured && this.driveClient) {
      try {
        const stream = Readable.from(fileBuffer);
        const folderId = env.GOOGLE_DRIVE_FOLDER_ID || undefined;

        const fileMetadata: drive_v3.Schema$File = {
          name: `${folderCategory}_${Date.now()}_${fileName}`,
          parents: folderId ? [folderId] : undefined,
          description: `NIT Durgapur Campus Services - ${folderCategory} asset`
        };

        const media = {
          mimeType,
          body: stream
        };

        const res = await this.driveClient.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id, name, webViewLink, webContentLink, size',
          supportsAllDrives: true
        });

        const fileId = res.data.id || crypto.randomUUID();

        // Ensure file is publicly readable through link or proxy
        try {
          await this.driveClient.permissions.create({
            fileId,
            requestBody: {
              role: 'reader',
              type: 'anyone'
            },
            supportsAllDrives: true
          });
        } catch (permErr) {
          console.warn('[GoogleDriveStorage] Permission grant notice:', permErr);
        }

        return {
          fileId,
          webUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
          fileName,
          mimeType,
          fileSize: fileBuffer.length
        };
      } catch (err) {
        console.error('[GoogleDriveStorage] Upload failed, falling back to local sandbox:', err);
      }
    }

    // High-fidelity local sandbox fallback (persists file and returns valid fileId and proxy URL)
    const fileId = `gdrive_mock_${crypto.randomBytes(8).toString('hex')}`;
    const sanitizedFileName = `${fileId}_${path.basename(fileName)}`;
    const targetPath = path.join(this.localFallbackDir, sanitizedFileName);
    fs.writeFileSync(targetPath, fileBuffer);

    return {
      fileId,
      webUrl: `/api/images/preview/${fileId}`,
      fileName,
      mimeType,
      fileSize: fileBuffer.length
    };
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (this.isConfigured && this.driveClient && !fileId.startsWith('gdrive_mock_')) {
      try {
        await this.driveClient.files.delete({ fileId, supportsAllDrives: true });
        return true;
      } catch (err) {
        console.error(`[GoogleDriveStorage] Error deleting file ${fileId}:`, err);
        return false;
      }
    }

    // Local fallback deletion
    try {
      const files = fs.readdirSync(this.localFallbackDir);
      for (const f of files) {
        if (f.startsWith(fileId)) {
          fs.unlinkSync(path.join(this.localFallbackDir, f));
          return true;
        }
      }
    } catch {
      // Ignored
    }
    return true;
  }

  getFileUrl(fileId: string): string {
    return `/api/images/preview/${fileId}`;
  }

  async getFileStream(fileId: string): Promise<{ stream: Readable; mimeType: string; fileName: string }> {
    if (this.isConfigured && this.driveClient && !fileId.startsWith('gdrive_mock_')) {
      try {
        const meta = await this.driveClient.files.get({
          fileId,
          fields: 'name, mimeType',
          supportsAllDrives: true
        });

        const res = await this.driveClient.files.get(
          { fileId, alt: 'media', supportsAllDrives: true },
          { responseType: 'stream' }
        );

        return {
          stream: res.data as Readable,
          mimeType: meta.data.mimeType || 'application/octet-stream',
          fileName: meta.data.name || `${fileId}.jpg`
        };
      } catch (err) {
        console.error(`[GoogleDriveStorage] Error fetching stream for ${fileId}:`, err);
      }
    }

    // Local fallback
    const files = fs.readdirSync(this.localFallbackDir);
    for (const f of files) {
      if (f.startsWith(fileId)) {
        const filePath = path.join(this.localFallbackDir, f);
        const stream = fs.createReadStream(filePath);
        return {
          stream,
          mimeType: 'image/jpeg',
          fileName: f
        };
      }
    }

    throw new Error(`File not found: ${fileId}`);
  }
}
