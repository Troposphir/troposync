import * as fs from "fs-promise";
import * as path from "path";
import {Project} from "./project";
import {ProcessStatus, Process} from "./process-status";
import {Observable, Observer} from "rxjs";

export type ProjectBakerOptions = {
    project: Project,
    targetDirectorySuffix: string
};

export class ProjectBaker extends Process<ProjectBakerOptions, string> {
    public async getEstimate(): Promise<ProcessStatus<string> | null> {
        let files = await this.options.project.listFiles();
        return new ProcessStatus(0, files.length, "Obtaining files");
    }

    public run(): Observable<ProcessStatus<string>> {
        return Observable.create(async (observer: Observer<ProcessStatus<string>>) => {
            let destinationRoot = path.join(this.options.project.rootPath, this.options.targetDirectorySuffix);
            let tempRoot = destinationRoot + ".tmp";
            let files = await this.options.project.listFiles();
            observer.next(new ProcessStatus(0, files.length, "Preparing to apply"));
            for (let i = 0; i < files.length; ++i) {
                let info = files[i];
                let sourcePath = path.join(this.options.project.workPath, info.providingModule, info.filePath);
                let destination = path.join(tempRoot, info.filePath);
                observer.next(new ProcessStatus(
                    i,
                    files.length,
                    `Copying ${path.join(info.providingModule, info.filePath)}`
                ));
                await fs.mkdirs(path.dirname(destination));
                await fs.copy(sourcePath, destination);
            }
            observer.next(new ProcessStatus(files.length, files.length, `Moving temporary folder`));
            await fs.remove(destinationRoot);
            await fs.rename(tempRoot, destinationRoot);
            observer.complete();
        });
    }
}