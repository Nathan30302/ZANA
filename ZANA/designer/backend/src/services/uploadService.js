const cloudinary = require('cloudinary').v2;

// Image upload service using Cloudinary
class ImageUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadProfilePhoto(fileBuffer, userId, folder = 'zana/profiles') {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: `${userId}-${Date.now()}`,
            resource_type: 'auto',
            transformation: [
              { width: 400, height: 400, crop: 'fill', quality: 'auto' }
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }

  async uploadVenuePhoto(fileBuffer, venueId, folder = 'zana/venues') {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: `${venueId}-${Date.now()}`,
            resource_type: 'auto',
            transformation: [
              { width: 800, height: 600, crop: 'fill', quality: 'auto' }
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      console.error('Error uploading venue photo:', error);
      throw error;
    }
  }

  async uploadServiceImage(fileBuffer, serviceId, folder = 'zana/services') {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: `${serviceId}-${Date.now()}`,
            resource_type: 'auto',
            transformation: [
              { width: 600, height: 400, crop: 'fill', quality: 'auto' }
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      console.error('Error uploading service image:', error);
      throw error;
    }
  }

  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  async getOptimizedUrl(url, options = {}) {
    // Uses Cloudinary's URL transformation to optimize image
    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    };

    try {
      return cloudinary.url(url.split('/').pop(), defaultOptions);
    } catch (error) {
      console.error('Error generating optimized URL:', error);
      return url;
    }
  }
}

module.exports = new ImageUploadService();
