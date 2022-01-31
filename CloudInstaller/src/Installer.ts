import * as utils from '@ekliptor/apputils';
const nconf = utils.nconf,
    logger = utils.logger;
import {CommandResponse, Host, HostCommandResults} from "./structs/Host";
import {User} from "./structs/User";
import * as nodeSsh from "node-ssh";
import * as fs from "fs";
import * as path from "path";
import {CommandFileOptions, CommandFileParser} from "./CommandFileParser";


export class Installer {
    protected user: User;
    protected hosts: Host[] = [];
    protected debug: boolean = false;

    constructor(user: User, debug?: boolean) {
        this.user = user;
        if (debug)
            this.debug = true;
    }

    public addHost(host: Host): void {
        this.hosts.push(host);
    }

    public async runSingleCommand(command: string): Promise<HostCommandResults> {
        let results = new HostCommandResults();
        await this.connectToHosts();
        for (let i = 0; i < this.hosts.length; i++)
        {
            let res = await this.runCommand(command, this.hosts[i]);
            results.addResponse(this.hosts[i].host, res);
            this.hosts[i].instance.dispose()
            logger.info("Executed all commands on %s - results:", this.hosts[i].host, results.get(this.hosts[i].host));
        }
        await this.writeLogs(results);
        return results;
    }

    public async runCommandsFromFile(commandFile: string): Promise<HostCommandResults> {
        let results = new HostCommandResults();
        await this.connectToHosts(); // TODO better connect to hosts sequentially and run commands to avoid timeout issues
        let parser = new CommandFileParser(commandFile);
        let commands = await parser.getFileLines();
        let options = parser.getOptions();
        for (let i = 0; i < this.hosts.length; i++)
        {
            if (options.interactive === true) {
                let res = await this.runCommandInteractive(Object.assign([], commands), this.hosts[i], options);
                results.addResponse(this.hosts[i].host, res);
                continue;
            }
            // run all commands on 1 host first before going to the nex thost
            for (let u = 0; u < commands.length; u++)
            {
                let res = await this.runCommand(commands[u], this.hosts[i], options);
                results.addResponse(this.hosts[i].host, res);
            }
            this.hosts[i].instance.dispose()
            logger.info("Executed all commands on %s - results:", this.hosts[i].host, results.get(this.hosts[i].host));
        }
        await this.writeLogs(results);
        if (options.interactive === true) {
            setTimeout(() => {
                this.closeConnections();
            }, nconf.get("closeConnectionDelayMs"))
        }
        return results;
    }

    public async createVirtualMachine(): Promise<Host> {
        // nothing to do in parent
        return null;
    }

    public async removeVirtualMachine(): Promise<void> {
        // nothing to do in parent
    }

    // ################################################################
    // ###################### PRIVATE FUNCTIONS #######################

    protected async connectToHosts(): Promise<void> {
        let i = 0;
        try {
            for (; i < this.hosts.length; i++)
            {
                logger.verbose("Connecting via SSH to %s", this.hosts[i].host)
                //const ssh = new nodeSsh();
                this.hosts[i].instance = new nodeSsh(); // TODO use async.series() to allow parallel connections
                this.hosts[i].instance = await this.hosts[i].instance.connect({
                    host: this.hosts[i].host,
                    username: this.hosts[i].username,
                    privateKey: this.hosts[i].privateKeyFile,
                    passphrase: this.hosts[i].keyPassphrase
                });
            }
        }
        catch (err) {
            logger.error("Error connecting to host %s %s", i, this.hosts[i].host, err);
            throw new Error("Error connecting to host " + i);
        }
    }

    protected runCommand(command: string, host: Host, options: CommandFileOptions = new CommandFileOptions()) {
        return new Promise<CommandResponse>((resolve, reject) => {
            logger.verbose("Executing on %s command: %s", host.host, command);

            host.instance.execCommand(command, {cwd: options.cwd}).then((result) => {
                // { code: 0, signal: undefined, stdout: 'html', stderr: '' }
                resolve({stdOut: result.stdout, stdErr: result.stderr});
            }).catch((err) => {
                logger.error("Error running command on host: %s", host.host, err);
                resolve(null); // continue
            })
            // with the stream API we don't know when the command is done, but we can respond to interactive promts
            /*
            host.instance.exec('npm login', [], {
                cwd: '/home/staydown',
                onStdout(chunk) {
                    console.log('stdoutChunk', chunk.toString('utf8'))
                },
                onStderr(chunk) {
                    console.log('stderrChunk', chunk.toString('utf8'))
                },
            }).catch((err) => {
                logger.error("Error running command on host: %s", host.host, err);
                resolve(); // continue
            })
            */
        })
    }

    protected runCommandInteractive(commands: string[], host: Host, options: CommandFileOptions = new CommandFileOptions()) {
        return new Promise<CommandResponse>((resolve, reject) => {
            logger.verbose("Executing on %s %s interactive commands ", host.host, commands.length);

            // https://github.com/mscdex/ssh2#start-an-interactive-shell-session
            let output = {
                stdOut: "",
                stdErr: ""
            }
            let closed = false;
            let lastResponse = Date.now();
            host.instance.requestShell().then((stream) => {
                //if (err) throw err;
                stream.on('close', () => {
                    closed = true;
                    logger.verbose("Shell to %s closed", host.host)
                    //conn.end(); // not needed, class terminates connnection. we call dispose above to be sure
                    resolve(output);
                }).on('data', (data) => {
                    if (!data)
                        return;
                    const dataStr = data.toString().trim();
                    if (dataStr.length !== 0)
                        logger.verbose('STDOUT: ' + dataStr);
                    output.stdOut += data;
                    lastResponse = Date.now();
                }).stderr.on('data', (data) => {
                    if (!data)
                        return;
                    const dataStr = data.toString().trim();
                    if (dataStr.length !== 0)
                        logger.verbose('STDERR: ' + dataStr);
                    output.stdErr += data;
                    lastResponse = Date.now();
                });

                let checkRunNextCommand = () => {
                    if (lastResponse + nconf.get("interactiveCmdDelayMs") > Date.now())
                        return setTimeout(checkRunNextCommand.bind(this), nconf.get("interactiveCmdDelayMs"));
                    runNextCommand();
                }
                let runNextCommand = () => {
                    let next = commands.shift();
                    logger.verbose("CMD: " + next);
                    try {
                        if (next === undefined) {
                            try {
                                stream.end('exit\n');
                            }
                            catch (err) {
                                logger.warn("Couldn't send last exit command. Most likely the shell script already terminated the connection", err);
                            }
                            return;
                        }
                        stream.write(next + '\n'); // TODO how can we wait until it's executed? parse output
                    }
                    catch (err) {
                        logger.error("Error executing command on %s", host.host, err); // mostly "write after end"
                        if (err && err.toString().indexOf("ERR_STREAM_WRITE_AFTER_END") !== -1)
                            return; // don't cause endless loop
                        else if (closed === true)
                            return;
                    }
                    setTimeout(checkRunNextCommand.bind(this), nconf.get("interactiveCmdDelayMs"));
                }
                setTimeout(runNextCommand.bind(this), nconf.get("interactiveCmdDelayMs")); // start after login message
            })
        })
    }

    //protected switchWorkingDir(command: string) // use interactive shell for this

    protected async writeLogs(results: HostCommandResults): Promise<void> {
        try {
            await utils.file.ensureDir(nconf.get("logdir"));
            let writeOps = [];
            for (let res of results)
            {
                let hostname = res[0];
                let hostResult = res[1];
                let logPath = path.join(nconf.get("logdir"), hostname + ".log");
                writeOps.push(fs.promises.writeFile(logPath, hostResult.stdOut, {encoding: "utf8"}));
                if (hostResult.stdErr.length !== 0) {
                    logPath = path.join(nconf.get("logdir"), hostname + "-err.log");
                    writeOps.push(fs.promises.writeFile(logPath, hostResult.stdErr, {encoding: "utf8"}));
                }
            }
            await Promise.all(writeOps)
        }
        catch (err) {
            logger.error("Error writing logfiles to disk", err);
        }
    }

    // TODO putDirectory, putFiles & getFile
    // can not be integrated with .sh scripts. Create a new function runFileOps() for this?

    protected closeConnections() {
        for (let i = 0; i < this.hosts.length; i++)
        {
            if (typeof this.hosts[i].instance.dispose === "function")
                this.hosts[i].instance.dispose();
        }
    }
}
