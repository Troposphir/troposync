import * as rimraf from "rimraf-then";
import * as lodash from "lodash";
import * as fs from "fs-promise";
import * as path from "path";
import {Project} from "./project";
import {ProcessStatus} from "./process-status";
import {Observable, Observer} from "rxjs";

export class ProjectBaker {
    public static bake(
        project: Project,
        targetDirectorySuffix: string = "dist"
    ): Observable<ProcessStatus<string>> {
        const id = lodash.uniqueId("bake");
        return Observable.create(async (observer: Observer<ProcessStatus<string>>) => {
            let destinationRoot = path.join(project.rootPath, targetDirectorySuffix);
            let tempRoot = destinationRoot + ".tmp";
            let files = await project.listFiles();
            observer.next(new ProcessStatus(id, 0, files.length, "Preparing to apply"));
            for (let i = 0; i < files.length; ++i) {
                let info = files[i];
                let sourcePath = path.join(project.workPath, info.providingModule, info.filePath);
                let destination = path.join(tempRoot, info.filePath);
                observer.next(new ProcessStatus(
                    id, i,
                    files.length,
                    `Copying ${path.join(info.providingModule, info.filePath)}`
                ));
                await fs.mkdirs(path.dirname(destination));
                await fs.copy(sourcePath, destination);
            }
            observer.next(new ProcessStatus(id, files.length, files.length, `Moving temporary folder`));
            await rimraf(destinationRoot, {disableGlob: true});
            await fs.rename(tempRoot, destinationRoot);
            observer.complete();
        });
    }
}