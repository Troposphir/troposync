export class InvalidVersionError extends Error {
    constructor(message: string) {
        super(message)
    }
}

export class Version {
    public major: number;
    public minor: number;
    public patch: number;

    constructor(major: number, minor: number, patch: number) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    public static fromObject(version: {major: number, minor: number, patch: number}): Version {
        return new Version(version.major, version.minor, version.patch);
    }

    public static fromString(versionString: string): Version {
        let matches = /^(\d+)\.(\d+)\.(\d+)$/.exec(versionString);
        if (matches == null) {
            throw new InvalidVersionError(`Tried parsing an invalid version '${versionString}'.`);
        }
        let numberParts: number[] = [];
        for (let entry of matches.entries()) {
            let value = parseInt(entry[1]);
            if (isNaN(value)) {
                throw new InvalidVersionError(`Field #${entry[0]} with value '${entry[1]}' is not a number!`);
            }
            numberParts.push(value);
        }
        let [, major, minor, patch] = numberParts;
        return new Version(major, minor, patch);
    }

    public toString(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }

    public compare(other: Version): number {
        if (this.patch != other.patch) {
            return this.patch - other.patch;
        }
        if (this.minor != other.minor) {
            return this.minor - other.minor;
        }
        if (this.major != other.major) {
            return this.major - other.major;
        }
        return 0;
    }
}
