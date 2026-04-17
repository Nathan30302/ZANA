// File upload utilities for mobile apps
// Note: This utility is currently not used in the customer app
// It requires expo-document-picker and expo-image-picker to be installed

export class FileUploadUtil {
  static async pickImage(options = {}) {
    throw new Error('Image picker not available - requires expo-image-picker');
  }

  static async pickDocument(options = {}) {
    throw new Error('Document picker not available - requires expo-document-picker');
  }

  static async getFileBuffer(uri: string): Promise<string> {
    throw new Error('File system utilities not available');
  }

  static async uploadFile(uri: string, endpoint: string, token: string) {
    throw new Error('Upload functionality not implemented');
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  static isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const ext = filename.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(ext || '');
  }
}

export default FileUploadUtil;
