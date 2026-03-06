import { SearchRepository } from '../repositories/search.repository';
import { AppError } from '../utils/api-response.util';

export class SearchService {
    constructor(private readonly searchRepo: SearchRepository) { }

    async performSearch(query: string) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        if (query.length < 2) {
            throw new AppError('Qidiruv matni kamida 2 ta belgidan iborat bo\'lishi kerak', 400, 'SEARCH_QUERY_TOO_SHORT');
        }

        return this.searchRepo.globalSearch(query.trim());
    }
}
