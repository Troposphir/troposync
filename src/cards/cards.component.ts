import { Component, Inject, OnInit } from '@angular/core';

import { NewsEntry } from './news';
import { NewsService } from './news-card.service';

@Component ({
    selector: 'cards',
    template: `
        <div *ngFor="let n of news">
            <card [newsEntry]="n"></card>
        </div>
    `,
    providers: [NewsService]
})
export class CardsComponent implements OnInit {
    news: NewsEntry[];

    constructor(@Inject(NewsService) private newsService: NewsService) { }

    getNews(): void {
        this.newsService.getNews().then(news => this.news = news);
    }

    ngOnInit(): void {
        this.getNews();
    }
}