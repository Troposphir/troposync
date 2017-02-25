import { Component, Inject, OnInit } from '@angular/core';

import { Card } from '../cards/card';
import { NewsService } from './news.service';

@Component ({
    selector: 'news',
    template: `<card [model]="n" *ngFor="let n of news"></card>`,
    styles: [`
        :host {
            display: grid;
            grid-gap: 10px;
            grid-template: 1fr 1fr / 1fr 1fr;
            grid-template-areas:
                "first second"
                "first third";
        }
        
        card:nth-child(1) {
            grid-area: first;
        }
        
        card:nth-child(2) {
            grid-area: second;
        }
        
        card:nth-child(3) {
            grid-area: third;
        }
    `],
    providers: [NewsService]
})
export class CardsComponent implements OnInit {
    news: Card[];

    constructor(@Inject(NewsService) private newsService: NewsService) { }

    getNews(): void {
        this.newsService.getNews().then(news => this.news = news);
    }

    ngOnInit(): void {
        this.getNews();
    }
}