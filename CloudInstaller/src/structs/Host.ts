import * as utils from '@ekliptor/apputils';
const nconf = utils.nconf,
    logger = utils.logger;

export interface HostConfig {
    host: string;
    username: string;
    privateKeyFile?: string;
    keyPassphrase?: string;
}

export class Host {
    public host: string;
    public username: string;
    public privateKeyFile: string;
    public keyPassphrase: string = "";
    public instance: any = null; // node-ssh promise-based instance // TODO wait for typings

    constructor(host: string, username: string, privateKeyFile: string) {
        this.host = host;
        this.username = username;
        this.privateKeyFile = privateKeyFile;
    }

    public static loadHosts(hosts: HostConfig[], privateKeyDefault = "", keyPassphraseDefault = ""): Host[] {
        let hostList = [];
        for (let i = 0; i < hosts.length; i++)
        {
            let privateKey = hosts[i].privateKeyFile ? hosts[i].privateKeyFile : privateKeyDefault;
            let keyPassphrase = hosts[i].keyPassphrase ? hosts[i].keyPassphrase : keyPassphraseDefault;
            let hostObj = new Host(hosts[i].host, hosts[i].username, privateKey);
            if (keyPassphrase)
                hostObj.keyPassphrase = keyPassphrase;
            hostList.push(hostObj);
        }
        return hostList;
    }
}

export interface CommandResponse {
    stdOut: string;
    stdErr: string;
}

export class HostCommandResults extends Map<string, CommandResponse> { // (hostname, command results)
    constructor() {
        super()
    }

    public addResponse(host: string, res: CommandResponse) {
        if (!res)
            return;
        let existing = this.get(host);
        if (existing === undefined)
            existing = {stdOut: res.stdOut, stdErr: res.stdErr};
        else {
            if (res.stdOut) {
                if (existing.stdOut)
                    existing.stdOut += "\n\n";
                existing.stdOut += res.stdOut;
            }
            if (res.stdErr) {
                if (existing.stdErr)
                    existing.stdErr += "\n\n";
                existing.stdErr += res.stdErr;
            }
        }
        this.set(host, existing);
    }
}