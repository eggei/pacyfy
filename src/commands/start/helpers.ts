import {
  Config,
  Database,
  DatabaseDeclarationFields,
  Service,
  ServiceDeclarationFields,
} from "../../config";
import { APP_NAME } from "../../constants";
import { TaskContext } from "./types";

export function validateCleanConfig(
  config: Config,
  oclifError: (msg: string, opts: { exit: number }) => void
) {
  const validConfig = structuredClone(config) as Config;

  // check missing required config
  const missingServiceConfig = checkServiceDeclarations(config.services);
  const missingDatabaseConfig = checkDatabaseDeclarations(config.databases);
  const missingConfig = [...missingServiceConfig, ...missingDatabaseConfig];
  stopProcessAndlogErrorForMissingConfig(missingConfig, config, oclifError);

  function trimAllStringValInObject<T>(obj: T): T {
    const trimmedObj = structuredClone(obj) as T;
    for (let key in trimmedObj) {
      const k = key as keyof T;
      if (trimmedObj?.[k] && typeof trimmedObj[k] === "string") {
        trimmedObj[k] = (trimmedObj[k] as string)?.trim() as never;
      }
    }
    return trimmedObj;
  }

  // trim commands
  validConfig.services = validConfig.services.map(trimAllStringValInObject);
  validConfig.databases = validConfig.databases.map(trimAllStringValInObject);

  return validConfig;
}

function checkServiceDeclarations(services: Service[]) {
  const requiredFields: ServiceDeclarationFields[] = [
    ServiceDeclarationFields.name,
    ServiceDeclarationFields.run,
    ServiceDeclarationFields.healthCheckURL,
  ];
  const missingConfig: string[] = [];
  services.forEach((service, i) => {
    requiredFields.forEach((field) => {
      if (!service[field]) {
        if (field === ServiceDeclarationFields.name) {
          missingConfig.push(`Service at index ${i} is missing name field`);
          return;
        }
        missingConfig.push(
          `${service.name} is missing "${field}" field in service declaration`
        );
      }
    });
  });
  return missingConfig;
}

function checkDatabaseDeclarations(dbs: Database[]) {
  const requiredFields: DatabaseDeclarationFields[] = [
    DatabaseDeclarationFields.name,
    DatabaseDeclarationFields.run,
    DatabaseDeclarationFields.healthCheckCMD,
    DatabaseDeclarationFields.tearDownCMD,
  ];

  const missingConfig: string[] = [];
  dbs.forEach((db, i) => {
    requiredFields.forEach((field) => {
      if (!db[field]) {
        if (field === DatabaseDeclarationFields.name) {
          missingConfig.push(`Service at index ${i} is missing name field`);
          return;
        }
        missingConfig.push(
          `${db.name} is missing "${field}" field in service declaration`
        );
      }
    });
  });
  return missingConfig;
}

/**
 * This function will stop the oclif process if there is a missing config
 * otherwise, it won't do anything
 */
function stopProcessAndlogErrorForMissingConfig(
  missingConfig: string[],
  config: Config,
  oclifError: (msg: string, opts: { exit: number }) => void
) {
  if (missingConfig.length > 0) {
    oclifError(
      `Missing required config in service declaration:

--> ${missingConfig.join(`\n--> `)}

Received service declarations:
Services: ${JSON.stringify(config.services, null, 2)}}
Databases: ${JSON.stringify(config.databases, null, 2)}
`,
      { exit: 1 }
    );
  }
}

export function initContext(config: Config) {
  const initialContext = { error: "", process: null };
  const context: TaskContext = {
    services: {},
    databases: {},
  };
  config.services.forEach((service) => {
    context.services[service.name] = initialContext;
  });
  config.databases.forEach((db) => {
    context.databases[db.name] = initialContext;
  });
  return context;
}

/**
 *
 * @param error Error needs to be printed out
 * @param service Service declaration
 * @returns A new error message that is pretty printed for the user
 *
 * Use this to get a nice error message for the user
 */
export function getPacyfyError(err: string | Error) {
  return new Error(`
--------------------------------
${APP_NAME} Message:

${err.toString() || "No error log produced by the process"}
--------------------------------`);
}
