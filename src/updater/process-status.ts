import * as lodash from "lodash";
import {Observable, Observer} from "rxjs";

export abstract class Process<TOptions, TStatus> {
    private state: ProcessStatus<TStatus> | null = null;

    constructor(protected options: TOptions) {}

    protected abstract run(): Observable<ProcessStatus<TStatus>>;
    protected abstract getEstimate(): Promise<ProcessStatus<TStatus> | null>;
    protected abstract get defaultPayload(): TStatus;

    public fire(): Observable<ProcessStatus<TStatus>> {
        let state = new ProcessStatus(0, 1, this.defaultPayload);
        return this.run().do(value => {
            state.replace(value, lodash.identity);
            this.state = state;
        });
    }

    public async getMutableStatusOrEstimate(): Promise<ProcessStatus<TStatus> | null> {
        if (this.state == null) {
            let estimate = await this.getEstimate();
            this.state = estimate;
            return estimate;
        }
        return this.state;
    }
}

export class ProcessStatus<T> {
    public currentStep: number;
    public stepCount: number;
    public payload: T;

    public constructor(step: number, max: number, info: T) {
        this.advance(step, max, info);
    }

    public replace(source: ProcessStatus<T>, transform: (payload: T) => T = lodash.identity): ProcessStatus<T> {
        this.currentStep = source.currentStep;
        this.stepCount = source.stepCount;
        this.payload = transform(source.payload);
        return this;
    }

    public advance(currentStep: number, stepCount: number, payload: T): ProcessStatus<T> {
        this.currentStep = currentStep;
        this.stepCount = stepCount;
        this.payload = payload;
        return this;
    }
}

export class ProcessGroup<T> extends Process<any, T> {
    public constructor(options: any, protected defaultPayload: T) {
        super(options);
    }

    private processes: Process<any, T>[] = [];

    public add(item: Process<any, T>) {
        this.processes.push(item);
    }

    public extend(items: Iterable<Process<any, T>>) {
        this.processes.push(...items);
    }

    public clear() {
        this.processes.splice(0);
    }

    protected async getEstimate(): Promise<ProcessStatus<T> | null> {
        let status = new ProcessStatus<T | undefined>(0, 0, undefined);
        for (let process of this.processes) {
            let estimate = await process.getMutableStatusOrEstimate();
            if (estimate == null) {
                continue;
            }
            status.payload = estimate!.payload;
            status.currentStep += estimate!.currentStep;
            status.stepCount += estimate!.stepCount;
        }
        if (status.payload == undefined) {
            return null;
        }
        return status as ProcessStatus<T>;
    }

    protected run(): Observable<ProcessStatus<T>> {
        return Observable.create(async(observer: Observer<ProcessStatus<T>>) => {
            let totalStatus = new ProcessStatus(0, 1, this.defaultPayload);
            for (let process of this.processes) {
                await process.fire().forEach(async(status: ProcessStatus<T>) => {
                    if (totalStatus == null) {
                        return;
                    }
                    totalStatus.currentStep += status.currentStep;
                    totalStatus.stepCount += status.stepCount;
                    totalStatus.payload = status.payload;
                    observer.next(totalStatus);
                });
            }
            observer.complete();
        });
    }
}