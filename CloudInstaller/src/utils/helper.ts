
// check if we are inside the "build" dir to find our real module root for text includes + storage
import * as path from "path";
import * as fs from "fs";

const moduleRoots = [path.resolve(__dirname, '..', '..', '..')  + path.sep,
    path.resolve(__dirname, '..', '..') + path.sep];
const moduleRoot = fs.existsSync(path.join(moduleRoots[0], "package.json")) ? moduleRoots[0] : moduleRoots[1];

export function getModuleBaseDir() {
    return moduleRoot;
}
