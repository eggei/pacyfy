import { readFileSync } from "fs";
import { join } from "path";

type Config = Record<string, any>;
type Args = {
  rootPath: string;
  configPath?: string;
};

const defaultConfigPath = "pacyfy.config.json";
export default function getConfig({
  rootPath,
  configPath = defaultConfigPath,
}: Args) {
  const filePath = join(rootPath, configPath);
  try {
    const configFile = readFileSync(filePath, "utf8");
    const config: Config = JSON.parse(configFile);
    return { config, error: null };
  } catch (error) {
    return {
      config: null,
      error: new Error("Failed to parse the configuration file."),
    };
  }
}
