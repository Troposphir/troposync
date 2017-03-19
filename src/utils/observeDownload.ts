import * as request from "request";
import requestProgress = require("request-progress");
import {Observable, Observer} from "rxjs";
import {Stream} from "stream";

export type RequestProgressState = {
    percent: number,
    speed?: number,
    size: {
        total?: number,
        transferred: number
    },
    time: {
        elapsed: number,
        remaining?: number
    }
};

export function observeDownload(url: string): [Stream, Observable<RequestProgressState>] {
    let req = requestProgress(request.get(url), {
        throttle: 200
    });
    return [req, Observable.create((observer: Observer<RequestProgressState>) => {
        req.on("progress", (state: RequestProgressState) => {
            observer.next(state);
        });
        req.on("error", (e: any) => {
            observer.error(e);
        });
        req.on("end", () => {
            observer.complete();
        });
    })];
}