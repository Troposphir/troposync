import rimraf = require("rimraf-then");
import fs = require("fs-promise");
import path = require("path");
import {Project} from "./project";
import {ProcessStatus} from "./process-status";
import {Observable, Observer} from "rxjs";

export class ProjectBaker {
    public static bake(
        project: Project,
        targetDirectorySuffix: string = "dist"
    ): Observable<ProcessStatus<string>> {
        return Observable.create(async (observer: Observer<ProcessStatus<string>>) => {
            let destinationRoot = path.join(project.rootPath, targetDirectorySuffix);
            let tempRoot = destinationRoot + ".tmp";
            let files = await project.listFiles();
            observer.next(new ProcessStatus(0, files.length, "Preparing to apply"));
            for (let i = 0; i < files.length; ++i) {
                let info = files[i];
                let sourcePath = path.join(project.workPath, info.providingModule, info.filePath);
                let destination = path.join(tempRoot, info.filePath);
                observer.next(new ProcessStatus(
                    i,
                    files.length + 1,
                    `Copying ${path.join(info.providingModule, info.filePath)}`
                ));
                await fs.mkdirs(path.dirname(destination));
                await fs.copy(sourcePath, destination);
            }
            observer.next(new ProcessStatus(files.length, files.length, `Moving temporary folder`));
            await rimraf(destinationRoot, {disableGlob: true});
            await fs.rename(tempRoot, destinationRoot);
            observer.complete();
        });
    }
}