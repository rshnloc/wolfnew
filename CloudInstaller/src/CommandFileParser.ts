import * as utils from '@ekliptor/apputils';
const nconf = utils.nconf,
    logger = utils.logger;
import * as path from "path";
import * as helper from "./utils/helper";


export class CommandFileOptions {
    interactive: boolean = false;
    cwd: string = "/"; // only for non-interactive shell
}

export class CommandFileParser {
    protected readonly filename: string;
    protected options = new CommandFileOptions();

    constructor(filename: string) {
        this.filename = path.isAbsolute(filename) ? filename : path.join(helper.getModuleBaseDir(), filename);
    }

    public async getFileLines(): Promise<string[]> {
        try {
            let file = await utils.file.readFile(this.filename);
            return this.readLines(file);
        }
        catch (err) {
            logger.error("Error reading command file: %s", this.filename, err)
            throw new Error("Error parsing command file: " + this.filename)
        }
    }

    public getOptions() {
        return this.options;
    }

    // ################################################################
    // ###################### PRIVATE FUNCTIONS #######################

    protected readLines(file: string): string[] {
        let lines = [];
        let lineArr = file.split("\n");
        for (let i = 0; i < lineArr.length; i++)
        {
            let line = lineArr[i];
            if (nconf.get("trimCommandLines"))
                line = line.trim();
            if (line.length === 0)
                continue;
            if (line[0] === "#") { // remove comments
                if (lines.length === 0) // command options can only be at the top
                    this.parseOption(line)
                continue;
            }
            lines.push(line);
        }
        return lines;
    }

    protected parseOption(line: string) {
        line = line.trim().substr(1); // always trim options
        if (line.length !== 0 && line[0] === "!")
            return; // first line of bash scripts
        let lineParts = line.split("=", 2);
        switch (lineParts[0])
        {
            case "interactive":
                this.options.interactive = lineParts.length === 1 || this.isTrueValue(lineParts[1]); // treat no value as true
                break;
            case "cwd":
                if (lineParts.length === 2)
                    this.options.cwd = lineParts[1];
                break;
            default:
                logger.warn("Unknown command option '%s' on top of file", line);
        }
    }

    protected isTrueValue(value: string) {
        return value === "1" || value.toLowerCase() === "true";
    }
}
