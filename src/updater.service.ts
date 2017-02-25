import * as fs from "fs-promise";
import * as path from "path";
import * as lodash from "lodash";

import {Injectable, Inject} from "@angular/core";
import {Http, RequestOptions, URLSearchParams} from "@angular/http";
import 'rxjs/add/operator/toPromise';

import {Project} from "./updater/project";
import {FileChange, ModuleChange} from "./updater/change";
import {ProcessStatus} from "./updater/process-status";
import {Observable, Observer} from "rxjs";
import {Version} from "./updater/version";
import {config} from "./app.component";
import {hashFile} from "./updater/utils";

@Injectable()
export class UpdaterService {
    private static get apiUrl(): string {
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
                hash: string
            }[]
        }[] = response.json();

        return data.map(u => new ModuleChange(
            u.name,
            Version.fromObject(u.version),
            u.changes.map(c => new FileChange(c.file, c.action, c.hash))
        ));
    }

    public performChange(project: Project, module: string, change: FileChange): Observable<ProcessStatus<string>> {
        const id = lodash.uniqueId("change");
        return Observable.create(async (observer: Observer<ProcessStatus<string>>) => {
            let destination = project.getFullPath(module, change.file);
            await fs.mkdirs(path.dirname(destination));

            try {
                await fs.access(destination, fs.constants.R_OK)
                observer.next(new ProcessStatus(id, 0, 2, `Comparing hashes for ${change.file}`));
                if ((await hashFile(destination)) == change.hash) {
                    observer.next(new ProcessStatus(id, 2, 2, `File is up to date, skipping`));
                    observer.complete();
                    return;
                }
            } catch (e) {}

            if (change.action === "modify") {
                observer.next(new ProcessStatus(id, 1, 2, `Downloading ${change.file}`));
                let response = await this.http.get(`${UpdaterService.apiUrl}/file/${module}/${change.file}`).toPromise();
                await fs.writeFile(destination, response.text());
                observer.next(new ProcessStatus(id, 2, 2, `Downloaded ${change.file}`));
            } else if (change.action === "delete") {
                await fs.remove(destination);
            }
            observer.complete();
        });
    }
}