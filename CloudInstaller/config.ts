
//const now = new Date()

const config = {
    "debug": false,
    "projectName": "CloudInstaller",
    "logfile": "logfile.log",
    "logdir": "logs",
    "trimCommandLines": true,
    "closeConnectionDelayMs": 500,
    //"interactiveCmdDelayMs": 1600,
    "interactiveCmdDelayMs": 3100,

    // AWS
    aws: {
        "apiVersion": "2016-11-15",
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
    "privateKeyFile": "/Users/username/.ssh/id_rsa",
    "keyPasspharse": "XXX"
}

export {config}
