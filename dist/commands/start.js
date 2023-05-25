"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const getConfig_1 = require("../getConfig");
const child_process_1 = require("child_process");
class Start extends core_1.Command {
    async run() {
        const { flags } = await this.parse(Start);
        const { error, config } = (0, getConfig_1.default)({
            rootPath: this.config.root,
            configPath: undefined,
        });
        if (error) {
            this.error(error);
        }
        const { services } = config;
        for (const [serviceName, serviceConfig] of Object.entries(services)) {
            this.log(`Executing command for ${serviceName} service`);
            const childProcess = (0, child_process_1.spawn)(serviceConfig.run, {
                shell: true,
                stdio: "inherit",
            });
            childProcess.on("error", (error) => {
                this.error(`Failed to execute the command: ${error.message}`);
            });
            childProcess.on("close", (code) => {
                if (code === 0) {
                    this.log("Command executed successfully!");
                }
                else {
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
exports.default = Start;
Start.description = `Starts the Cypress tests based on the given parameters`;
Start.examples = [
    "<%= config.bin %> <%= command.id %> --type=e2e",
    "<%= config.bin %> <%= command.id %> --all",
];
Start.flags = {
    all: core_1.Flags.boolean({ char: "a", default: false }),
    type: core_1.Flags.string({
        char: "t",
        description: "Test category to run",
        options: ["component", "e2e", "ui"],
        exclusive: ["all"],
    }),
};
