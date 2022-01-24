import {Installer} from "./Installer";
import {User} from "./structs/User";

export class AwsInstaller extends Installer {
    constructor(user: User, debug?: boolean) {
        super(user, debug);
    }

    public async createVirtualMachine(): Promise<void> {

    }

    public async removeVirtualMachine(): Promise<void> {

    }
}
