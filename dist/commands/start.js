"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
class Start extends core_1.Command {
    async run() {
        const { args, flags } = await this.parse(Start);
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
        description: "Test category to run",
        options: ["component", "e2e", "ui"],
        exclusive: ["all"],
    }),
};
