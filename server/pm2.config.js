module.exports = {
    apps: [
        {
            name: "inference-server",
            script: "./index.js",
            kill_timeout: 15000,
            args: ["zip"],
            watch: [".", '!./node_modules/', ""],
            "watch_options": {
                "followSymlinks": false
            }
        }
    ]
};
