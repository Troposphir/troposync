import {Component, Input} from '@angular/core';
import {isNullOrUndefined} from "util";

@Component({
    selector: 'progress-bar',
    template: `<div class="container">
        <div class="bar" [style.width]="_getPercentString()"></div>
    </div>`,
    styles: [`
        .container {
            height: 100%;
            padding: 1px;
            background-color: black;
        }
        
        .bar {
            width: 100%;
            height: 100%;
            background-color: #015C94;
        }
    `]
})
export class ProgressBarComponent {
    @Input() private min: number = 0;
    @Input() private max: number = 1;
    @Input() private value?: number = undefined;

    public getCompletionFactor(): number  {
        let range = this.max - this.min;
        return (this.value - this.min) / range;
    }

    public _getPercentString(): String | null {
        if (isNullOrUndefined(this.value)) {
            return null;
        }
        return (this.getCompletionFactor() * 100) + "%";
    }
}