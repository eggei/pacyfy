import { Args, Command, Flags, ux } from "@oclif/core";
import { readFileSync } from "fs";
import { join } from "path";
import getConfig from "../getConfig";
import { spawn, spawnSync } from "child_process";

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
    for (const service of services) {
      const { name, run } = service;
      ux.action.start(`Running service: ${name}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const result = spawnSync(run, { shell: true, stdio: "inherit" });
      if (result.error !== undefined) {
        this.error(result.error, { exit: 1 });
      }

      if (result.status !== 0) {
        this.error("ERROR", { exit: result.status || undefined });
      }
      ux.action.stop();
    }
  }
}
