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
            border: #0c3447 1px solid;
            background-color: #0f1c24;
            border-radius: 3px;
        }
        
        .bar {
            width: 100%;
            height: 100%;
            background-color: #005e92;
            border-radius: 3px;
            transition: all .2s ease-in-out;
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

    public _getPercentString(): string | null {
        if (isNullOrUndefined(this.value)) {
            return null;
        }
        return (this.getCompletionFactor() * 100) + "%";
    }
}