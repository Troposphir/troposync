import {spawn} from "child_process";
import * as path from "path";

export default function startProgram(targetPath: string, args: string[] = []): void {
    spawn(targetPath, args, {
        detached: true,
        stdio: "ignore",
        cwd: path.dirname(targetPath)
    }).unref();
}