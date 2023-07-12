import { Command, Flags } from "@oclif/core";
import getConfig from "../../config";
import Listr = require("listr");
import {
  getServiceHealthTask,
  getServiceStartTask,
} from "./service-task-executor";
import { TaskContext } from "./types";
import { initContext, validateCleanConfig } from "./helpers";
import {
  getDatabaseHealthTask,
  getDatabaseStartTask,
} from "./database-task-executor";
import { spawn } from "child_process";
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

    // if there are problems in config provided, error out here
    const validatedConfig = validateCleanConfig(config, this.error);
    const { services, databases } = validatedConfig;

    const serviceTasks = services.map((service) => ({
      title: `Service: ${service.name}`,
      task: (ctx: TaskContext) => {
        return new Listr<TaskContext>(
          [...getServiceStartTask(service), ...getServiceHealthTask(service)],
          {
            concurrent: true,
          }
        );
      },
    }));

    const databaseTasks = databases.map((db) => ({
      title: `Database: ${db.name}`,
      task: (ctx: TaskContext) => {
        new Listr<TaskContext>(
          [...getDatabaseStartTask(db), ...getDatabaseHealthTask(db)],
          { concurrent: true }
        );
      },
    }));

    const testTasks = [
      {
        title: "Tests",
        task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
          // If error found in any of the service execution tasks, skip the tests
          // TODO: Make context a class and everytime an error is set
          // it should also set ctx.error = true
          // so we can skip the tests
          if (ctx.error) {
            task.skip("Error found in service execution tasks");
            return Promise.reject();
          }
        },
      },
    ];

    const tearDownTasks = [
      {
        title: "Tear down",
        task: () =>
          new Listr<TaskContext>([
            {
              title: "Tear down",
              task: () => {
                // teardown db
                const tearDownCMD = databases[0].tearDownCMD;
                const [cmd, ...args] = tearDownCMD.split(" ");
                const dbTearDownProcess = spawn(cmd, args);
                let error = "";
                dbTearDownProcess.stderr.on("data", (chunk) => {
                  error += chunk.toString();
                });

                dbTearDownProcess.on("exit", (code) => {
                  if (code !== 0) {
                    const errorLog = `Following error occured in the database tear down process: ${
                      error ||
                      "Process does not produce error output. Error might be related to something else than the process itself."
                    }`;
                    this.error(errorLog, { exit: 1 });
                  }
                });
              },
            },
          ]),
      },
    ];

    const tasks = new Listr<TaskContext>([
      ...serviceTasks,
      ...databaseTasks,
      ...testTasks,
      ...tearDownTasks,
    ]);

    tasks.run(initContext(config)).catch((err: any) => {
      this.error(err);
    });
  }
}
