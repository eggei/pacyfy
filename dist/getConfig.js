"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const defaultConfigPath = "pacyfy.config.json";
function getConfig({ rootPath, configPath = defaultConfigPath, }) {
    const filePath = (0, path_1.join)(rootPath, configPath);
    let configFile;
    let config;
    try {
        configFile = (0, fs_1.readFileSync)(filePath, "utf8");
    }
    catch (error) {
        return { error: new Error(error) };
    }
    // at this point we know that the file exists
    // so we can try to parse
    try {
        config = JSON.parse(configFile);
    }
    catch (error) {
        return { error: new Error(error) };
    }
    // if everything went alright, we can return the config
    return { config };
}
exports.default = getConfig;
