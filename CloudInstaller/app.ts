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
import {AwsInstaller} from "./src/AwsInstaller";

//let hosts = Host.loadHosts(nconf.get("hosts"), nconf.get("privateKeyFile"), nconf.get("keyPasspharse"));
const user = new User(argv.u, argv.p);
//let installer = new Installer(user, argv.debug);
let installer = new AwsInstaller(user, argv.debug);

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
        logger.info("create instance for %s", user.email);
        installer.createVirtualMachine().then((vm) => {
            installer.addHost(vm);
            runCommand = installer.runCommandsFromFile(typeof argv.f === "string" ? argv.f : path.join("commands", "bitbrain", "install-bot.sh"));
            if (runCommand !== null) {
                runCommand.then((commandResults) => {
                    logger.info("Successfully executed all commands.");
                    logger.info("To access your bot open: https://%s:8443", vm.host);
                }).catch((err) => {
                    logger.error("Error during remote install commands", err);
                });
            }
        });
    }
    else if (argv.delete === true) {
        installer.removeVirtualMachine().then(() => {
            logger.info("Successfully terminated AWS instance.");
        }).catch((err) => {
            logger.error("Error removing AWS VM", err);
        })
    }
}
catch (err) {
    logger.error("Error running remote installer", err)
}
