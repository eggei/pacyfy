type Config = Record<string, any>;
type Args = {
    rootPath: string;
    configPath?: string;
};
export default function getConfig({ rootPath, configPath, }: Args): {
    config: Config;
    error: null;
} | {
    config: null;
    error: Error;
};
export {};
