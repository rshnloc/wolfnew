import {Installer} from "./Installer";
import {User} from "./structs/User";
import * as AWS from "aws-sdk";
import * as path from "path";
import * as helper from "./utils/helper";
import {config} from "../config";

export class AwsInstaller extends Installer {
    protected ec2: AWS.EC2;

    constructor(user: User, debug?: boolean) {
        super(user, debug);
        // load config
        AWS.config.loadFromPath(path.join(helper.getModuleBaseDir(), "config", "aws.json"));
        // Create EC2 service object
        this.ec2 = new AWS.EC2({apiVersion: config.aws.apiVersion});
    }

    public async createVirtualMachine(): Promise<void> {
        // AMI is amzn-ami-2011.09.1.x86_64-ebs
        const instanceParams = {
            ImageId: 'ami-07d02ee1eeb0c996c', // Debian 10
            InstanceType: 't2.small',
            KeyName: 'AWS-East1', // https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#KeyPairs:
            MinCount: 1,
            MaxCount: 1
        };
    }

    public async removeVirtualMachine(): Promise<void> {

    }
}
