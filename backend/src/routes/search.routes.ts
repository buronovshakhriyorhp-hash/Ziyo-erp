import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { SearchService } from '../services/search.service';
import { SearchRepository } from '../repositories/search.repository';
import { authenticate } from '../middlewares/authenticate.middleware';

const searchRepo = new SearchRepository();
const searchSvc = new SearchService(searchRepo);
const searchCtrl = new SearchController(searchSvc);

const router = Router();

/**
 * GET /api/search?q=...
 * Barcha asosiy resurslar bo'yicha global izlash.
 */
router.get(
    '/',
    authenticate,
    searchCtrl.globalSearch
);

export default router;
