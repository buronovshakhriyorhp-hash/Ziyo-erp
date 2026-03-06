import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { sendSuccess } from '../utils/api-response.util';

export class SearchController {
    constructor(private readonly searchSvc: SearchService) { }

    globalSearch = async (req: Request, res: Response): Promise<void> => {
        const query = req.query.q as string;
        const results = await this.searchSvc.performSearch(query);
        sendSuccess(res, results, 'Qidiruv natijalari', 200);
    };
}
