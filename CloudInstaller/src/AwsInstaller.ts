import * as utils from '@ekliptor/apputils';
const nconf = utils.nconf,
    logger = utils.logger;
import {Installer} from "./Installer";
import {User} from "./structs/User";
import * as AWS from "aws-sdk";
import * as path from "path";
import * as helper from "./utils/helper";
import {config} from "../config";
import {AWSError} from "aws-sdk/lib/error";
import {Host} from "./structs/Host";
import {DescribeInstancesRequest} from "aws-sdk/clients/ec2";

interface AwsTag {
    key: string;
    value: string;
}

export class AwsInstaller extends Installer {
    protected ec2: AWS.EC2;

    constructor(user: User, debug?: boolean) {
        super(user, debug);
        // load config
        AWS.config.loadFromPath(path.join(helper.getModuleBaseDir(), "config", "aws.json"));
        // Create EC2 service object
        this.ec2 = new AWS.EC2({apiVersion: config.aws.apiVersion});
    }

    public async createVirtualMachine(): Promise<Host> {
        // AMI is amzn-ami-2011.09.1.x86_64-ebs
        const instanceParams = {
            ImageId: config.aws.instanceAMI,
            InstanceType: config.aws.instanceType,
            KeyName: config.aws.keyName,
            MinCount: 1,
            MaxCount: 1,
            SecurityGroups: [config.aws.securityGroupName],
        };

        // Create a promise on an EC2 service object
        const instancePromise = new AWS.EC2({apiVersion: config.aws.apiVersion}).runInstances(instanceParams).promise();
        let instanceId = "";

        try {
            const data = await instancePromise;
            console.log("instance result", data);

            instanceId = data.Instances[0].InstanceId;
            console.log("Created instance", instanceId);
            // Add tags to the instance
            let tagParams = {Resources: [instanceId], Tags: [
                    {
                        Key: config.deployAppName,
                        Value: this.user.email,
                    }
                ]};

            // Create a promise on an EC2 service object
            let tagPromise = new AWS.EC2({apiVersion: config.aws.apiVersion}).createTags(tagParams).promise();
            // Handle promise's fulfilled/rejected states
            await tagPromise;
            console.log("Instance tagged");
        }
        catch (err) {
            //let awsErr = err as AWS.AWSError;
            logger.error("Error creating AWS instance", err);
            throw err;
        }

        try {
            let ec2Instance = await this.waitForInstance(instanceId);
            const keyFile = path.join(helper.getModuleBaseDir(), "config", "aws.pem");
            const host = new Host(ec2Instance.PublicDnsName, config.aws.instanceUsername, keyFile);
            console.log("AWS host created", host)
            return host;
        }
        catch (err) {
            logger.error("Error waiting for AWS instance", err);
            throw err;
        }
    }

    public async removeVirtualMachine(): Promise<void> {
        let ec2InstanceId = "";
        // find instance by user email address
        try {
            ec2InstanceId = await this.getInstanceIdByTag({
                key: config.deployAppName,
                value: this.user.email,
            });

            logger.info("terminating AWS instance with ID %s", ec2InstanceId);
        }
        catch (err) {
            logger.error("Error finding instance to remove", err);
            throw err;
        }

        // terminate AWS instance
        try {
            const queryParams = {
                InstanceIds: [ec2InstanceId]
            };
            // Create a promise on an EC2 service object
            const instancePromise = new AWS.EC2({apiVersion: config.aws.apiVersion}).terminateInstances(queryParams).promise();

            const data = await instancePromise;

        }
        catch (err) {
            logger.error("Error terminating instance %s", err);
            throw err;
        }
    }

    protected async waitForInstance(instanceId: string): Promise<AWS.EC2.Instance> {
        const queryParams = {
            InstanceIds: [instanceId]
        };

        // wait in loop
        const maxWait = 100;
        for (let i = 0; i < maxWait; i++)
        {
            logger.verbose("Waiting for instance to be ready %d/%d ...", i, maxWait);
            // Create a promise on an EC2 service object
            const instancePromise = new AWS.EC2({apiVersion: config.aws.apiVersion}).describeInstances(queryParams).promise();

            const data = await instancePromise;
            //console.log("instance query", data);

            const ec2Instance = data.Reservations[0].Instances[0]; // we query exactly 1
            if (ec2Instance.State.Code === 16) {
                console.log("Instance is running");
                console.log("DNS: %s", ec2Instance.PublicDnsName);
                console.log("IP: %s", ec2Instance.PublicIpAddress);
                await utils.promiseDelay(16000); // give the instance more time to ensure SSH daemon starts
                return ec2Instance;
            }
        }

        throw new Error("AWS instance did not start up, timeout waiting. ID " + instanceId);
    }

    protected async getInstanceIdByTag(tag: AwsTag): Promise<string> {
        logger.verbose("Getting instance ID of tag %s ...", tag.value);

        const queryParams: AWS.EC2.DescribeInstancesRequest = {
            //InstanceIds: [instanceId]
            Filters: [{
                Name: "tag:" + tag.key,
                Values: [tag.value]
            }],
            MaxResults: 1000, // max allowed
        };
        // Create a promise on an EC2 service object
        const instancePromise = new AWS.EC2({apiVersion: config.aws.apiVersion}).describeInstances(queryParams).promise();

        const data = await instancePromise;

        if (data.Reservations.length === 0 || data.Reservations[0].Instances.length === 0)
            throw new Error("No instance found. Already terminated? Tag: " + tag.value);

        // find the 1st active instance (not state == terminated)
        for (let i = 0; i < data.Reservations.length; i++)
        {
            const ec2Instance = data.Reservations[i].Instances[0]; // get the current one
            if (ec2Instance.State.Code === 48)
                continue; // Name == terminated

            console.log("found instance in state:", ec2Instance.State);
            return ec2Instance.InstanceId;
        }

        throw new Error("No instance found with tag value: " + tag.value);
    }
}
