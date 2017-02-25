import {Router, Request, Response} from "express";
import {Version} from "../updater/version";
import {Project, FileInfo} from "../updater/project";
import * as lodash from "lodash";
import * as path from "path";
import {FileChange, ModuleChange} from "../updater/change";
import {async_handler} from "./utils";
import {hashFile} from "../updater/utils";

/*
 * The server works a bit different than the client:
 * Each Project is a client-module, and each Module is a version delta.
 * This allows the server to generate efficient deltas for any version gap.
 */

export const UpdatesRouter: Router = Router();

function isModuleNameValid(module: string): boolean {
    return module.match(/[a-zA-Z0-9._-]+/) != null;
}

function getModulePath(module: string): string {
    return path.join("depot", module);
}

async function getUpdatesSinceVersion(project: Project, version: Version): Promise<FileChange[]> {
    //enable only versions newer than the client's current
    let previousEnableStates = {};
    for (let update of project.modules) {
        previousEnableStates[update.name] = update.enabled;
        update.enabled = update.version.compare(version) > 0;
    }
    //get the delta files
    let files = await project.listFiles();
    //restore enable status
    for (let updateName in previousEnableStates) {
        project.getModule(updateName).enabled = previousEnableStates[updateName];
    }

    function getAction(file: FileInfo): string {
        if (path.extname(file.filePath) == ".delete") {
            return "delete";
        } else {
            return "modify";
        }
    }
    return Promise.all(lodash.map(files, async f => {
        let filePath = path.posix.normalize(f.filePath.replace(path.sep, path.posix.sep));
        let hash = await hashFile(project.getFullPath(f.providingModule, f.filePath));
        return new FileChange(filePath, getAction(f), hash);
    }));
}

UpdatesRouter.get("/file/:module/*", async_handler(async (req: Request, res: Response) => {
    let module: string = (<any>req.params).module;

    // don't let path escape from the folder by forcing relative and crippling climbing
    let safePath = path.normalize(`./${req.params[0].replace("..", "")}`);

    //check if the file is actually part of the project
    let project = await Project.open(getModulePath(module));
    let file = (await project.listFiles()).find(f => f.filePath == safePath);

    if (file) {
        res.sendFile(project.getFullPath(file.providingModule, file.filePath));
    } else {
        res.sendStatus(404);
    }
}));

UpdatesRouter.get("/latest", async_handler(async (req: Request, res: Response) => {
    let clientCurrentVersions = lodash(req.query).toPairs()
        .map(([k, v]: string[]) => [k, Version.fromString(v)])
        .filter(([name, _version]: [string, Version]) => isModuleNameValid(name))
        .map(([name, version]: [string, Version]) => ({
            module: Project.open(getModulePath(name)),
            clientVersion: version,
            name
        }))
        .value();
    if (clientCurrentVersions.length == 0) {
        res.send([]);
        return;
    }
    let moduleChanges: (ModuleChange | null)[] = await Promise.all(clientCurrentVersions.map(async bundle => {
        try {
            let module: Project = await bundle.module;
            let latest = lodash.last(module.modules).version;
            if (latest.compare(bundle.clientVersion) <= 0) {
                return null;
            }
            return new ModuleChange(
                bundle.name,
                latest,
                await getUpdatesSinceVersion(module, bundle.clientVersion)
            );
        } catch (e) {
            console.error(e);
            return null;
        }
    }));

    res.json(moduleChanges.filter(c => c != null));
}));