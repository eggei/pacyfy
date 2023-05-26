import { readFileSync } from "fs";
import { join } from "path";

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

type ConfigResponse = { error?: Error; config?: Config };

const defaultConfigPath = "pacyfy.config.json";
export default async function getConfig({
  rootPath,
  configPath = defaultConfigPath,
}: Args): Promise<ConfigResponse> {
  const filePath = join(rootPath, configPath);
  let configFile: string;
  let config: Config;

  try {
    configFile = readFileSync(filePath, "utf8");
  } catch (error) {
    return { error: new Error(error as string) };
  }

  // at this point we know that the file exists
  // so we can try to parse
  try {
    config = JSON.parse(configFile);
  } catch (error) {
    return { error: new Error(error as string) };
  }

  // if everything went alright, we can return the config
  return { config };
}
