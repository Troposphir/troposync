import {Version} from "./version";

export class ModuleChange {
    public constructor(
        public name: string,
        public version: Version,
        public changes: FileChange[]
    ) {}
}

export class FileChange {
    public constructor(
        public file: string,
        public action: string,
        public hash: string
    ) {}
}