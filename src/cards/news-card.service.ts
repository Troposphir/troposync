import { Injectable } from '@angular/core';

import { NewsEntry } from './news';
import { NEWS } from './mock-news';

@Injectable()
export class NewsService {
    getNews(): Promise<NewsEntry[]> {
        return Promise.resolve(NEWS);
    }
}