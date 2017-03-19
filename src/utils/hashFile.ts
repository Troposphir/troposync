import {createHash} from "crypto";
import * as fs from "fs-promise";
import {Observable, Observer} from "rxjs";
import {ProcessStatus} from "../updater/process-status";

export default function(path: string): Observable<ProcessStatus<string>> {
    return Observable.create(async (observer: Observer<ProcessStatus<string>>) => {
        let hash = createHash("sha256");
        hash.setEncoding("hex");

        let status = new ProcessStatus(0, 1, "");
        let file = fs.createReadStream(path);
        let stat = await fs.stat(path);

        observer.next(status.advance(0, stat.size, ""));
        file.pipe(hash);
        file.on("data", (chunk: Buffer) => {
            status.currentStep += chunk.length;
            observer.next(status);
        });
        file.on("end", () => {
            hash.end();
            observer.next(status.advance(stat.size, stat.size, hash.read() as string));
            observer.complete();
        });
        file.on("error", (e: any) => {
            observer.error(e);
        });
    });
}