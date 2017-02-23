import { Component, Input } from '@angular/core';
import { NewsEntry } from './news';

@Component ({
    selector: 'card',
    templateUrl: './cards/card.component.html',
    styles: [`
        .news-card {
            display: inline-block;
            position: relative;
            border: #0c3447 1px solid;
        }
        .news-card .info {
            position: absolute;
            bottom: 0;
            background-color: rgba(15, 28, 36, 0.97);
            padding: 12px;
        }

        .news-card .info .news-title {
            font-weight: 300;
            text-transform: uppercase;
            padding-bottom: 6px;
        }

        .news-card .info .news-desc {
            font-weight: 100;
            font-size: 0.9em;
        }
    `]
})
export class CardComponent {
    @Input() newsEntry: NewsEntry;
}