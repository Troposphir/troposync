export class ProcessStatus<T> {
    public currentStep: number;
    public stepCount: number;
    public payload: T;

    public constructor(step: number, max: number, info: T) {
        this.currentStep = step;
        this.stepCount = max;
        this.payload = info;
    }
}