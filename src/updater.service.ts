import fs = require("fs-promise");
import path = require("path");

import {Injectable, Inject, OpaqueToken} from "@angular/core";
import {Http, RequestOptions, URLSearchParams} from "@angular/http";
import 'rxjs/add/operator/toPromise';

import {Project} from "./updater/project";
import {FileChange, ModuleChange} from "./updater/change";
import {ProcessStatus} from "./updater/process-status";
import {Observable, Observer} from "rxjs";
import {Version} from "./updater/version";

export let UPDATE_API_URL = new OpaqueToken("updater.api.url");

@Injectable()
export class UpdaterService {
    private constructor(@Inject(Http) public http: Http, @Inject(UPDATE_API_URL) private apiUrl: string) {
    }

    public async getChanges(project: Project): Promise<ModuleChange[]> {
        let params = new URLSearchParams();
        for (let module of project.modules) {
            params.set(module.name, module.version.toString());
        }
        let response = await this.http.get(`${this.apiUrl}/latest`, new RequestOptions({search: params})).toPromise();
        let data: {
            module: string,
            version: string
            changes: {file: string, action: string}[]
        }[] = response.json();
        return data.map(u => new ModuleChange(
            u.module,
            Version.fromString(u.version),
            u.changes.map(c => new FileChange(c.file, c.action))
        ));
    }

    public performChange(project: Project, module: string, change: FileChange): Observable<ProcessStatus<string>> {
        return Observable.create(async (observer: Observer<ProcessStatus<string>>) => {
            let destination = path.join(project.workPath, module, change.file);
            if (change.action === "modify") {
                observer.next(new ProcessStatus(0, 1, `Downloading ${change.file}`));
                let response = await this.http.get(`${this.apiUrl}/file/${module}/${change.file}`).toPromise();
                await fs.writeFile(destination, response.text());
                observer.next(new ProcessStatus(0, 1, `Downloaded ${change.file}`));
            } else if (change.action === "delete") {
                fs.remove(destination);
            }
            observer.complete();
        });
    }
}