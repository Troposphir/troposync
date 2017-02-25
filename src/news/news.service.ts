import { Injectable } from '@angular/core';

import { Card } from '../cards/card';
import { NEWS } from './mock-news';

@Injectable()
export class NewsService {
    getNews(): Promise<Card[]> {
        return Promise.resolve(NEWS);
    }
}