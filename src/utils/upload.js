import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Allowed MIME types for community post uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain'
];

// Max file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Disk storage — saves to /uploads/community/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/community/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, GIF, TXT'
      ),
      false
    );
  }
};

export const uploadPostFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).single('file');

/**
 * Express middleware wrapper that handles multer errors gracefully
 */
export const handleFileUpload = (req, res, next) => {
  uploadPostFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10 MB.'
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};
