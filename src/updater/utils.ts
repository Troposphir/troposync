import {createHash} from "crypto";
import {createReadStream} from "fs-promise";

export function hashFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let hash = createHash("sha256");
        hash.setEncoding("hex");

        let file = createReadStream(path);
        file.pipe(hash);
        file.on("end", () => {
            hash.end();
            resolve(hash.read());
        });
        file.on("error", () => {
            reject();
        });
    });
}