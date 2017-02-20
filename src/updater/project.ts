import lodash = require("lodash");
import fs = require("fs-promise");
import path = require("path");
import {Version} from "./version";

function getWorkPath(root: string): string {
    return path.join(root, ".sync");
}

async function deepFileList(root: string): Promise<string[]> {
    let contents = await fs.readdir(root).then(paths => Promise.all(paths.map(p => path.join(root, p)).map(async p => ({
        stat: await fs.stat(p),
        path: p
    }))));
    let files = contents.filter(s => !s.stat.isDirectory()).map(s => s.path);
    let directories = contents.filter(s => s.stat.isDirectory());
    let innerFiles = await Promise.all(directories.map(async d => deepFileList(d.path)));
    return files.concat(...innerFiles);
}

export class FileInfo {
    public filePath: string;
    public providingModule: string;

    constructor(filepath: string, module: string) {
        this.filePath = filepath;
        this.providingModule = module;
    }
}

export class ModuleDescriptor {
    public name: string;
    public version: Version;
    public enabled: boolean;
}

export class Project {
    public modules: ModuleDescriptor[];
    public rootPath: string;

    public get workPath() {return getWorkPath(this.rootPath);}

    public static async open(root: string): Promise<Project | null> {
        let stat = await fs.stat(root);
        if (!stat.isDirectory()) {
            return null;
        }
        let workpath = getWorkPath(root);
        if (!(await fs.stat(workpath)).isDirectory()) {
            return null;
        }
        let contents = await fs.readFile(path.join(workpath, "status.json"));
        let descriptor = JSON.parse(contents.toString("utf8"));
        let project = new Project();
        project.modules = descriptor.modules.map((m: {name: string, version: string, enabled: boolean}) => {
            let mod = new ModuleDescriptor();
            mod.name = m.name;
            mod.version = Version.fromString(m.version);
            mod.enabled = m.enabled || false;
            return mod;
        });
        project.rootPath = path.resolve(path.normalize(root));
        return project;
    }

    public async listFiles(): Promise<FileInfo[]> {
        let workPath = getWorkPath(this.rootPath);
        let files = await Promise.all(lodash(this.modules)
            .reverse()
            .map((m: ModuleDescriptor) => deepFileList(path.join(workPath, m.name)))
            .value()
        );
        return lodash(files)
            .flatten()
            .map((file: string) => {
                let relative = path.relative(workPath, file);
                let module = relative.split(path.sep, 2)[0];
                return new FileInfo(path.relative(path.join(workPath, module), file), module);
            })
            .uniqBy((i: FileInfo) => i.filePath)
            .value()
    }
}