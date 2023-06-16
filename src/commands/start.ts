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
            [getServiceStartTask(service), getServiceHealthTask(service)],
            { concurrent: true }
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

        // If log in the process
        serviceProcess.stdout.on("data", (data) => {
          observer.next(data);
          observer.complete();
        });

        // If error in the process
        serviceProcess.stderr.on("data", (data) => {
          observer.next("[ERROR] Could not run the service");
          observer.error(new Error(data));
          ctx[service.name] = { error: true };
        });

        // If process is closed
        serviceProcess.on("close", (code) => {
          if (code != 0) {
            observer.error(
              new Error(`Failed to start service - exit code ${code}`)
            );
          }
        });
      }) as unknown as Listr.ListrTaskResult<TaskContext>;
    },
  };
}

function getServiceHealthTask(service: Service) {
  return {
    title: `Health check`,
    task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
      return new Observable((observer) => {
        let intervalCode: NodeJS.Timer;
        let retryCount = 0;

        const tryHealth = () => {
          retryCount++;
          if (retryCount === 1) {
            intervalCode = setInterval(() => tryHealth(), 1000);
          }
          observer.next(
            `(Attempt ${retryCount}) Pinging health check endpoint: ${service.healthCheckURL}`
          );

          const serviceProcess = spawn("curl", [
            "-sSf",
            service.healthCheckURL,
          ]);

          // If log in the process
          serviceProcess.stdout.on("data", (data) => {
            observer.next(data);
            observer.complete();
          });

          if (retryCount > 10) {
            clearInterval(intervalCode);
            // If error in the process
            serviceProcess.stderr.on("data", (data) => {
              observer.next("[ERROR] Health check failed");
              observer.error(new Error(data));
              ctx[service.name] = { error: true };
            });

            // If process is closed
            serviceProcess.on("close", (code) => {
              if (code != 0) {
                observer.error(
                  new Error(`Failed to start service - exit code ${code}`)
                );
              }
            });
          }
        };

        tryHealth();
      }) as unknown as Listr.ListrTaskResult<TaskContext>;
    },
  };
}
