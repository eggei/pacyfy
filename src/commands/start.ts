import { Args, Command, Flags } from "@oclif/core";
import { readFileSync } from "fs";
import { join } from "path";
import getConfig from "../getConfig";
import { spawn } from "child_process";

export default class Start extends Command {
  static description = `Starts the Cypress tests based on the given parameters`;

  static examples = [
    "<%= config.bin %> <%= command.id %> --type=e2e",
    "<%= config.bin %> <%= command.id %> --all",
  ];

  static flags = {
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

    const { error, config } = getConfig({
      rootPath: this.config.root,
      configPath: undefined,
    });

    if (error) {
      this.error(error);
    }
    const { services } = config;
    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      this.log(`Executing command for ${serviceName} service`);
      const childProcess = spawn((serviceConfig as any).run, {
        shell: true,
        stdio: "inherit",
      });

      childProcess.on("error", (error) => {
        this.error(`Failed to execute the command: ${error.message}`);
      });

      childProcess.on("close", (code) => {
        if (code === 0) {
          this.log("Command executed successfully!");
        } else {
          this.error(`Command execution failed with exit code ${code}`, {
            exit: code || undefined,
          });
        }
      });
    }

    if (flags.all) {
      this.log("Running all the test categories");
      return;
    }
    if (!flags.type) {
      this.error("Please provide a test type with --type flag");
    }
    this.log(`Running ${flags.type} tests`);
  }
}
