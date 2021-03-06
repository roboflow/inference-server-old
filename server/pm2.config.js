module.exports = {
    apps: [
        {
            name: "inference-server",
            script: "./index.js",
            instances: process.env.INSTANCES || 1,
            exec_mode: "cluster",
            kill_timeout: 15000,
            watch: [".", '!./node_modules/', ""],
            "watch_options": {
                "followSymlinks": false
            }
        }
    ]
};
