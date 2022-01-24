// node --use_strict --max-old-space-size=1024 app.js
// parameters: --debug
// --f: the path to the bash command file to execute
// --c: a command as string to execute (takes priority over -f)

import * as sourceMapSupport from "source-map-support";
sourceMapSupport.install();
import * as argvFunction from "minimist";
const argv = argvFunction(process.argv.slice(2));
import * as utils from '@ekliptor/apputils';
const nconf = utils.nconf,
    logger = utils.logger;
import {Installer} from "./src/Installer";
import {Host, HostCommandResults} from "./src/structs/Host";
import {User} from "./src/structs/User";
import * as path from "path";

//let hosts = Host.loadHosts(nconf.get("hosts"), nconf.get("privateKeyFile"), nconf.get("keyPasspharse"));
const user = new User(argv.u, argv.p);
let installer = new Installer(user, argv.debug)
try {
    let runCommand: Promise<HostCommandResults> = null;
    /*
    if (typeof argv.c === "string")
        runCommand = installer.runSingleCommand(argv.c);
    else if (typeof argv.f === "string")
        runCommand = installer.runCommandsFromFile(argv.f);
    else
        logger.error("parameter -d has to be a directory with NodeJS projects to install");
     */

    if (argv.create === true) {
        logger.info("create", user)
        runCommand = installer.runCommandsFromFile(typeof argv.f === "string" ? argv.f : path.join("commands", "bitbrain", "install-bot.sh"));
        installer.createVirtualMachine().then((vm) => {
            if (runCommand !== null) {
                runCommand.then((commandResults) => {
                    logger.info("Successfully executed all commands.");
                }).catch((err) => {
                    logger.error("Error during remote install commands", err);
                });
            }
        });
    }
    else if (argv.delete === true) {
        // TODO
    }
}
catch (err) {
    logger.error("Error running remote installer", err)
}
