import {Component, Input} from '@angular/core';
import { Card } from './card';

@Component ({
    selector: 'card',
    templateUrl: './cards/card.component.html',
    styles: [`
        :host {
            display: block;
        }

        .card {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column-reverse;
            border: #0c3447 1px solid;
            background-size: cover;
        }
        
        .info {
            flex: 0;
            background-color: rgba(15, 28, 36, 0.8);
            padding: 12px;
            max-height: 100px;
        }

        h3 {
            font-weight: 300;
            text-transform: uppercase;
            padding-bottom: 6px;
        }

        .description {
            font-weight: 200;
            font-size: 0.9em;
            text-overflow: ellipsis;
        }
    `]
})
export class CardComponent {
    @Input() model: Card;
}