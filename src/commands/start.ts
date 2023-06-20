import { Args, Command, Flags, ux } from "@oclif/core";
import { readFileSync } from "fs";
import { join } from "path";
import getConfig, { Service } from "../getConfig";
import { spawn, spawnSync } from "child_process";
import Listr = require("listr");
import { Observable } from "rxjs";

export default class Start extends Command {
  static description = `Starts the Cypress tests based on the given parameters`;

  static examples = [
    "<%= config.bin %> <%= command.id %> --type=e2e",
    "<%= config.bin %> <%= command.id %> --all",
  ];

  static flags = {
    config: Flags.string({ char: "c", description: "Path to the config file" }),
    all: Flags.boolean({ char: "a", default: false }),
    type: Flags.string({
      char: "t",
      description: "Test category to run",
      options: ["component", "e2e", "ui"],
      exclusive: ["all"],
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Start);

    if (flags.all) {
      this.log("Running all the test categories");
      return;
    }
    if (!flags.type) {
      this.error("Please provide a test type with --type flag");
    }

    this.log(`Starting test category: ${flags.type}`);

    const { error, config } = await getConfig({
      rootPath: this.config.root,
      configPath: flags.config,
    });

    if (error) {
      this.error(error, { exit: 1 });
    }

    if (!config) {
      this.error("Cannot get config file contents", { exit: 1 });
    }

    const { services } = config;

    const tasks = new Listr<TaskContext>(
      services.map((service) => ({
        title: `Service: ${service.name}`,
        task: () =>
          new Listr<TaskContext>(
            [getServiceStartTask(service), ...getServiceHealthTask(service)],
            { concurrent: false }
          ),
      }))
    );

    tasks.run().catch((err: any) => {
      this.error(err);
    });
  }
}

type ServiceName = string;
type TaskContext = Record<ServiceName, { error: boolean }>;

function getServiceStartTask(service: Service) {
  return {
    title: `Run`,
    task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
      return new Observable((observer) => {
        observer.next(`Running: ${service.run}`);
        const runCMD = service.run.split(" ");
        const serviceProcess = spawn(runCMD[0], [...runCMD.slice(1)]);

        // If error in the process
        let error = "";
        serviceProcess.stderr.on("data", (chunk) => {
          error += chunk.toString();
        });

        // If log in the process
        let log = "";
        serviceProcess.stdout.on("data", (chunk) => {
          log += chunk.toString();
          observer.next(log);
          observer.complete();
        });

        // If process is closed
        serviceProcess.on("close", (code) => {
          if (code !== 0) {
            observer.error(
              new Error(`Failed to run the service - ${error || log}`)
            );
            ctx[service.name] = { error: true };
          }
        });
      }) as unknown as Listr.ListrTaskResult<TaskContext>;
    },
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// config
const maxRetries = 10;
const healthRetryInterval = 1000;

function getServiceHealthTask(service: Service) {
  if (!service.healthCheckURL) {
    return [];
  }

  return [
    {
      title: `Health check`,
      task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
        return new Observable((observer) => {
          let retryCount = 0;

          const healthCheck = () => {
            retryCount++;
            const serviceProcess = spawn("curl", [
              "-sSf",
              service.healthCheckURL,
            ]);

            // keeps the log
            let log = "";
            serviceProcess.stdout.on("data", (chunk) => {
              log += chunk.toString();
              observer.next(log);
            });

            // If error in the process, retry if possible
            let error = "";
            serviceProcess.stderr.on("data", async (chunk) => {
              error += chunk.toString();
            });

            // If process is closed
            serviceProcess.on("close", (code) => {
              // if the code is 0, we're good
              if (code === 0) {
                observer.complete();
                return;
              }
              // if the retry count is maxed out, give some output
              if (retryCount === maxRetries) {
                console.log(log + `Exit code: ${code}`);
                if (error) {
                  ctx[service.name] = { error: true };
                  observer.error(new Error(error));
                  return;
                }
              }
            });

            // wait and retry
            observer.next(
              `Checking: ${service.healthCheckURL} (${retryCount}/${maxRetries} failed attempt) `
            );
            sleep(healthRetryInterval).then(healthCheck);
          };

          // start the health check
          healthCheck();
        }) as unknown as Listr.ListrTaskResult<TaskContext>;
      },
    },
  ];
}
