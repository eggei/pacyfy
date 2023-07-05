import { Command, Flags } from "@oclif/core";
import getConfig from "../../getConfig";
import Listr = require("listr");
import { getServiceHealthTask, getServiceStartTask } from "./task-executor";
import { TaskContext } from "./types";

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
