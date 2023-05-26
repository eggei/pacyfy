import { Command } from "@oclif/core";
export default class Start extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        config: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        all: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        type: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
    };
    run(): Promise<void>;
}
