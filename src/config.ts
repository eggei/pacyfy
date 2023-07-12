import { readFileSync } from "fs";
import { join } from "path";

export const defaultConfig = Object.freeze({
  configFilePath: "pacyfy.config.json",
  healthCheckTimeout: 30000, // ms
});

export enum ServiceDeclarationFields {
  name = "name",
  run = "run",
  healthCheckURL = "healthCheckURL",
  healthCheckTimeout = "healthCheckTimeout",
}
export type Service = {
  // required
  [ServiceDeclarationFields.name]: string;
  [ServiceDeclarationFields.run]: string;
  [ServiceDeclarationFields.healthCheckURL]: string;
  // optional
  [ServiceDeclarationFields.healthCheckTimeout]?: number;
};

export enum DatabaseDeclarationFields {
  name = "name",
  run = "run",
  healthCheckCMD = "healthCheckCMD",
  healthCheckTimeout = "healthCheckTimeout",
  tearDownCMD = "tearDownCMD",
  seedCMD = "seedCMD",
}

export type Database = {
  // required
  [DatabaseDeclarationFields.name]: string;
  [DatabaseDeclarationFields.run]: string;
  [DatabaseDeclarationFields.healthCheckCMD]: string;
  [DatabaseDeclarationFields.tearDownCMD]: string;
  // optional
  [DatabaseDeclarationFields.healthCheckTimeout]?: number;
  [DatabaseDeclarationFields.seedCMD]?: string;
};

export type Config = {
  configFilePath?: string;
  services: Service[];
  databases: Database[];
};

type Args = {
  rootPath: string;
  configPath?: string;
};

type ConfigResponse = { error?: Error; config?: Config };

export default async function getConfig({
  rootPath,
  configPath = defaultConfig.configFilePath,
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

  // empty config guard
  if (!config.services?.length) {
    config.services = [];
  }
  if (!config.databases?.length) {
    config.databases = [];
  }

  // if everything went alright, we can return the config
  return { config };
}
