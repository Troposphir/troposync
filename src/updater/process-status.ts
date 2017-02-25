import * as lodash from "lodash";

export class ProcessStatus<T> {
    public id: string;
    public currentStep: number;
    public stepCount: number;
    public payload: T;

    public constructor(id: string, step: number, max: number, info: T) {
        this.id = id;
        this.currentStep = step;
        this.stepCount = max;
        this.payload = info;
    }
}

export class ProcessStatusGroup<T> {
    private statuses: ProcessStatus<T>[];
    private finished: boolean = false;

    public constructor() {
        this.statuses = [];
    }

    public get stepCount(): number {
        return lodash.sumBy(this.statuses, "stepCount");
    }

    public get currentStep(): number {
        return lodash.sumBy(this.statuses, "currentStep");
    }

    public get current(): ProcessStatus<T> | null {
        if (this.finished) {
            return null;
        }
        return lodash.last(this.statuses);
    }

    public add(process: ProcessStatus<T>): void {
        let index = lodash.findIndex(this.statuses, s => s.id == process.id);
        if (index < 0) {
            this.statuses.push(process);
        } else {
            this.statuses[index] = process;
        }
    }

    public finish(): void {
        this.finished = true;
    }
}