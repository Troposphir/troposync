import rimraf = require("rimraf-then");
import fs = require("fs-promise");
import path = require("path");
import {Project} from "./project";
import {ProcessStatus} from "./process-status";

export class ProjectBaker {
    public static async bake(
        project: Project,
        targetDirectorySuffix: string = "dist",
        progressReport: (status: ProcessStatus<string>) => void = (_ => {})
    ): Promise<void> {
        let destinationRoot = path.join(project.rootPath, targetDirectorySuffix);
        let files = await project.listFiles();
        progressReport(new ProcessStatus(0, files.length + 1, "Preparing"));
        for (let i = 0; i < files.length; ++i) {
            let info = files[i];
            let sourcePath = path.join(project.workPath, info.providingModule, info.filePath);
            let destination = path.join(destinationRoot + ".tmp", info.filePath);
            progressReport(new ProcessStatus(
                i,
                files.length + 1,
                `Copying ${path.join(info.providingModule, info.filePath)}`
            ));
            await fs.mkdirs(path.dirname(destination));
            await fs.copy(sourcePath, destination);
        }
        progressReport(new ProcessStatus(1, 1, `Moving temporary folder`));
        await rimraf(destinationRoot, {disableGlob: true});
        await fs.rename(destinationRoot + ".tmp", destinationRoot);
    }
}