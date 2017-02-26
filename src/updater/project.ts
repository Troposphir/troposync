import lodash = require("lodash");
import fs = require("fs-promise");
import path = require("path");
import {Version} from "./version";

const IGNORED_EXTENSIONS = [".tmp"];

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

    private constructor() {}

    public get workPath() {return getWorkPath(this.rootPath);}

    public static async open(root: string, createWithModules?: string[]): Promise<Project> {
        let workPath = getWorkPath(root);
        let descriptor: {
            modules: {name: string, version: string, enabled: boolean}[]
        };
        if (createWithModules) {
            await fs.mkdirs(workPath);
        } else {
            let stat = await fs.stat(root);
            if (!stat.isDirectory()) {
                throw new Error("Project root not found");
            }
            if (!(await fs.stat(workPath)).isDirectory()) {
                throw new Error("Directory is not a valid troposync project");
            }
        }
        try {
            let contents = await fs.readFile(path.join(workPath, "status.json"));
            descriptor = JSON.parse(contents.toString("utf8"));
        } catch (e) {
            descriptor = {modules: []};
        }

        let project = new Project();
        project.modules = descriptor.modules.map(m => {
            let mod = new ModuleDescriptor();
            mod.name = m.name;
            mod.version = Version.fromString(m.version);
            mod.enabled = m.enabled || false;
            return mod;
        });
        project.rootPath = path.resolve(path.normalize(root));

        // insert required modules
        if (createWithModules) {
            for (let moduleName of createWithModules) {
                if (project.getModule(moduleName)) {
                    continue;
                }
                let descriptor = new ModuleDescriptor();
                descriptor.name = moduleName;
                descriptor.enabled = true;
                descriptor.version = Version.fromString("0.0.0");
                project.modules.push(descriptor);
            }
        }

        // guarantee existance of correct internal structure
        await project.save();
        return project;
    }

    public getModule(name: string): ModuleDescriptor | undefined {
        return lodash.find(this.modules, m => m.name === name);
    }

    public async save(): Promise<void> {
        // ensure module paths exist
        for (let module of this.modules) {
            await fs.mkdirs(path.join(this.workPath, module.name));
        }
        await fs.writeJson(path.join(this.workPath, "status.json"), {
            modules: this.modules.map(m => ({
                name: m.name,
                version: m.version.toString(),
                enabled: m.enabled
            }))
        });
    }

    public async listFiles(): Promise<FileInfo[]> {
        let files = await Promise.all(lodash(this.modules)
            .reverse()
            .filter("enabled")
            .map(m => deepFileList(path.join(this.workPath, m.name)))
            .value()
        );
        return lodash(files)
            .flatten()
            .map((file: string) => {
                let relative = path.relative(this.workPath, file);
                let module = relative.split(path.sep, 2)[0];
                return new FileInfo(path.relative(path.join(this.workPath, module), file), module);
            })
            .filter(i => IGNORED_EXTENSIONS.indexOf(path.extname(i.filePath)) < 0)
            .uniqBy(i => i.filePath)
            .value();
    }

    public getFullPath(module: string, file: string): string {
        return path.join(this.workPath, module, file);
    }
}