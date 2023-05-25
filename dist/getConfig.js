"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const defaultConfigPath = "pacyfy.config.json";
function getConfig({ rootPath, configPath = defaultConfigPath, }) {
    const filePath = (0, path_1.join)(rootPath, configPath);
    try {
        const configFile = (0, fs_1.readFileSync)(filePath, "utf8");
        const config = JSON.parse(configFile);
        return { config, error: null };
    }
    catch (error) {
        return {
            config: null,
            error: new Error("Failed to parse the configuration file."),
        };
    }
}
exports.default = getConfig;
