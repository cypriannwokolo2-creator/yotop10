/* eslint-disable no-restricted-syntax, @typescript-eslint/no-explicit-any -- Express middleware type chains */
import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { upload, processUpload, processProfileImage } from '../lib/upload';

const router: Router = Router();

router.post('/', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const variants = await processUpload(req.file.path);

    res.status(201).json({
      success: true,
      file: {
        original: variants.original,
        item_thumb: variants.item_thumb,
        hero_lg: variants.hero_lg,
      },
    });
  } catch (e: any) {
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
    }
    if (e?.message?.includes('File type')) {
      return res.status(400).json({ error: e.message });
    }
    if (e?.message?.includes('Input file is missing') || e?.message?.includes('Vips')) {
      return res.status(400).json({ error: 'Invalid image file' });
    }
    if (e?.code === 'ENOSPC') {
      return res.status(507).json({ error: 'Storage full' });
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.post('/profile', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const url = await processProfileImage(req.file.path);

    res.status(201).json({
      success: true,
      url,
    });
  } catch (e: any) {
    // Cleanup original file on sharp failure to avoid orphan
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
      // Also try to clean _profile.webp if partially created
      try {
        const ext = path.extname(req.file.path);
        const profilePath = req.file.path.replace(ext, '_profile.webp');
        await fs.unlink(profilePath);
      } catch {}
    }
    if (e?.message?.includes('File type')) {
      return res.status(400).json({ error: e.message });
    }
    if (e?.message?.includes('Input file is missing') || e?.message?.includes('Vips')) {
      return res.status(400).json({ error: 'Invalid image file' });
    }
    if (e?.code === 'ENOSPC') {
      return res.status(507).json({ error: 'Storage full, try again later' });
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
