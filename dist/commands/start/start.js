"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const getConfig_1 = require("../../getConfig");
const child_process_1 = require("child_process");
class Start extends core_1.Command {
    async run() {
        const { flags } = await this.parse(Start);
        if (flags.all) {
            this.log("Running all the test categories");
            return;
        }
        if (!flags.type) {
            this.error("Please provide a test type with --type flag");
        }
        this.log(`Starting test category: ${flags.type}`);
        const { error, config } = (0, getConfig_1.default)({
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
            this.log(`Running service: ${name}`);
            const childProcess = (0, child_process_1.spawn)(run, { shell: true, stdio: "inherit" });
            childProcess.on("data", (data) => {
                this.log(data.toString());
            });
            childProcess.on("data", (data) => {
                this.log(data.toString());
            });
            childProcess.on("error", (error) => {
                this.error(error);
            });
            childProcess.on("close", (code) => {
                if (code === 0) {
                    this.log("Done!");
                }
                else {
                    this.error(`ERROR`, {
                        exit: code || undefined,
                    });
                }
            });
        }
    }
}
exports.default = Start;
Start.description = `Starts the Cypress tests based on the given parameters`;
Start.examples = [
    "<%= config.bin %> <%= command.id %> --type=e2e",
    "<%= config.bin %> <%= command.id %> --all",
];
Start.flags = {
    config: core_1.Flags.string({ char: "c", description: "Path to the config file" }),
    all: core_1.Flags.boolean({ char: "a", default: false }),
    type: core_1.Flags.string({
        char: "t",
        description: "Test category to run",
        options: ["component", "e2e", "ui"],
        exclusive: ["all"],
    }),
};
