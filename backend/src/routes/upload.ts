import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router: Router = Router();

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Config Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.'));
    }
  },
});

// POST /api/admin/upload — Upload an image directly
router.post('/', upload.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Determine base URL dynamically or from env
    const backendUrl = process.env.INTERNAL_API_URL?.replace('/api', '') || 'http://localhost:8000';
    
    // Hardcoded to window origin structurally if on frontend, 
    // but the backend stores the true relative path.
    // It's safer to just return the relative path, and let the frontend append its known source.
    const relativeUrl = `/uploads/${req.file.filename}`;
    
    // For local dev, we assume backend runs on 8000 and has /uploads exposed
    const fullUrl = `http://localhost:8000${relativeUrl}`;

    res.status(200).json({ url: fullUrl, relativeUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
