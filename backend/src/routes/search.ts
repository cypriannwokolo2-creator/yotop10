import { Router, Request, Response } from 'express';
const router = Router();
router.get('/', (req: Request, res: Response) => res.json({ message: 'Search endpoint' }));
router.get('/suggestions', (req: Request, res: Response) => res.json({ message: 'Search suggestions' }));
module.exports = router;
