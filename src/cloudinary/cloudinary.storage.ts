import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer, { StorageEngine } from 'multer';

export const cloudinaryStorage: StorageEngine = new CloudinaryStorage({
  cloudinary,
  params: () => ({
    folder: 'flexiride',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    //image optimization
    transformation: [
      { width: 500, height: 500, crop: 'limit' }, // resize
      { quality: 'auto' }, // compress automatically
      { fetch_format: 'auto' }, // convert to best format - WebP if possible
    ],
  }),
});

export const cloudinaryUpload = multer({ storage: cloudinaryStorage });
