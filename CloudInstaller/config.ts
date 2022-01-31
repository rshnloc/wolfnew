
//const now = new Date()

const config = {
    "debug": false,
    "projectName": "CloudInstaller",
    "deployAppName": "WolfBot",
    "logfile": "logfile.log",
    "logdir": "logs",
    "trimCommandLines": true,
    "closeConnectionDelayMs": 500,
    //"interactiveCmdDelayMs": 1600,
    "interactiveCmdDelayMs": 3100,

    // AWS
    aws: {
        "apiVersion": "2016-11-15",

        "instanceAMI": "ami-07d02ee1eeb0c996c", // Debian 10, ssh user admin
        "instanceType": "t2.small",
        "keyName": "AWS-East1", // https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#KeyPairs:
        "instanceUsername": "admin",

        "securityGroupName": "WolfBot", // make sure SSH port 22 and HTTP 8443 is open
    },

    // NPM
    npm: {
        // https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow
        token: "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",
    },

    "hosts": [
        //{host: "", username: "", privateKeyFile: "", keyPassphrase: ""}
        /*
        {host: "5.123.142.123", username: "root"},
         */
    ],
    // global defaults for all hosts (if not specified above)
    //"privateKeyFile": "/Users/username/.ssh/id_rsa",
    "keyPasspharse": ""
}

export {config}
