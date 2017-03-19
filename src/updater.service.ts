import * as fs from "fs-promise";
import * as path from "path";

import {Injectable, Inject} from "@angular/core";
import {Http, RequestOptions, URLSearchParams} from "@angular/http";
import 'rxjs/add/operator/toPromise';

import {Project} from "./updater/project";
import {FileChange, ModuleChange} from "./updater/change";
import {ProcessStatus, Process} from "./updater/process-status";
import {Observable, Observer} from "rxjs";
import {Version} from "./updater/version";
import hashFile from "./utils/hashFile";
import {observeDownload, RequestProgressState} from "./utils/observeDownload";
import * as config from "./config";
import * as byteFormat from "./utils/byteFormat";

export type ChangeProcessOptions = {
    project: Project,
    module: string,
    change: FileChange
};

class ChangeProcess extends Process<ChangeProcessOptions, string> {
    protected defaultPayload: string = "Preparing download";

    protected run(): Observable<ProcessStatus<string>> {
        let {project, module, change} = this.options;
        return Observable.create(async (observer: Observer<ProcessStatus<string>>) => {
            let processStatus = new ProcessStatus(0, 1, "");
            let destination = project.getFullPath(module, change.file);
            await fs.mkdirs(path.dirname(destination));

            try {
                await fs.access(destination, fs.constants.R_OK);
                let localHash = "";
                await hashFile(destination).forEach(status => {
                    localHash = status.payload;
                    observer.next(processStatus.replace(status, () => {
                        return `Comparing hashes for ${path.basename(change.file)}`;
                    }));
                });
                if (localHash == change.hash) {
                    observer.next(processStatus.advance(1, 1, `File is up to date, skipping`));
                    observer.complete();
                    return;
                }
            } catch (e) {}

            if (change.action === "modify") {
                let [request, status] = observeDownload(`${UpdaterService.apiUrl}/file/${module}/${change.file}`);
                let file = await fs.createWriteStream(destination);
                request.pipe(file);
                await status.forEach((state: RequestProgressState) => {
                    let speedInfo = state.speed? ` at ${byteFormat.speed(state.speed)}` : "";
                    observer.next(processStatus.advance(
                        state.size.transferred,
                        state.size.total || state.size.transferred,
                        `Downloading ${path.basename(change.file)}${speedInfo}.`
                    ));
                });
                observer.next(processStatus.advance(processStatus.stepCount, processStatus.stepCount, "Downloaded"));
            } else if (change.action === "delete") {
                await fs.remove(destination);
            }
            observer.complete();
        });
    }

    protected async getEstimate(): Promise<ProcessStatus<string> | null> {
        let {change} = this.options;
        let size = change.size == undefined? 0 : change.size;
        return new ProcessStatus(0, size, `Preparing to download ${change.file}`);
    }
}

@Injectable()
export class UpdaterService {
    static get apiUrl(): string {
        return `${config.apiUrl}/update`;
    }

    //noinspection JSUnusedLocalSymbols
    private constructor(@Inject(Http) public http: Http) {}

    public async getChanges(project: Project): Promise<ModuleChange[]> {
        let params = new URLSearchParams();
        for (let module of project.modules) {
            if (!module.enabled) {
                continue;
            }
            params.set(module.name, module.version.toString());
        }
        let response = await this.http.get(`${UpdaterService.apiUrl}/latest`, new RequestOptions({search: params})).toPromise();
        let data: {
            name: string,
            version: {
                major: number,
                minor: number,
                patch: number
            },
            changes: {
                file: string,
                action: string,
                hash: string,
                size: number
            }[]
        }[] = response.json();
        return data.map(u => new ModuleChange(
            u.name,
            Version.fromObject(u.version),
            u.changes.map(c => new FileChange(c.file, c.action, c.hash, c.size))
        ));
    }

    //noinspection JSMethodCanBeStatic
    public change(project: Project, module: string, change: FileChange): Process<ChangeProcessOptions, string> {
        return new ChangeProcess({project, module, change});
    }
}