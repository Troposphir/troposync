let config: {
    apiUrl: string,
    gameRoot: string,
    executable: string,
    requiredModules: string[]
} = require("../sync.json");

Object.freeze(config);
Object.freeze(config.requiredModules);

export = config;