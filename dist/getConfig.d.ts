type Config = {
    configFilePath?: string;
    services: {
        name: string;
        run: string;
    }[];
};
type Args = {
    rootPath: string;
    configPath?: string;
};
type ConfigResponse = {
    error?: Error;
    config?: Config;
};
export default function getConfig({ rootPath, configPath, }: Args): ConfigResponse;
export {};
