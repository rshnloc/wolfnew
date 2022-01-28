# CloudInstaller

This is a deployment tool to create AWS EC2 instances of [WolfBot](https://wolfbot.org/).

## Requirements

You need an AWS account with billing enabled. This installer will create 1 `t2.small` EC2
instance per bot (per customer).

1. Create an AWS User in IAM: https://console.aws.amazon.com/iamv2/home
2. Make sure this user has the permission `AmazonEC2FullAccess` (as part of a group or directly).
3. Copy and paste the `accessKeyId` and `secretAccessKey` into [aws.json](config/aws.json).
4. Create a Key pair to access the VMs via SSH: https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#KeyPairs:
   1. make sure the region selected for the key pair is the same as in the `aws.json` of step 3 (default `us-east-1`)
   2. download and save the key as under `config/aws.pem` in this project

## Create a new bot instance

### Installation
In the project root dir, run: 

```
yarn install
yarn build
```

### Creating a new bot

In the project `build` dir, run:

```
node app.js --create -u=email@provider.com -p=12345
```

#### Parameters
- `u`: The email address of the user to register
- `p`: The password to login for this user.

The above command will return a unique URL for the customer to login and use the bot with the specified
credentials.

### Deleting a bot instance

In the project `build` dir, run:

```
node app.js --delete -u=email@provider.com
```

Where the `-u` parameter must be an existing bot instance (as created above).

You can also remove the instance manually in [AWS Console](https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:)
It contains a custom tag key `WolfBot` which contains the customer email address.

## Used Software

- [AWS SDK](https://github.com/aws/aws-sdk-js)

## Contact
Twitter: [@ekliptor](https://twitter.com/ekliptor) 
