import { Hook } from "@oclif/core";

const hook: Hook<"init"> = async function (opts) {
  process.stdout.write(`
                  ___     
  ___ ___ ___ _ _|  _|_ _ 
 | . | .'|  _| | |  _| | |
 |  _|__,|___|_  |_| |_  |
 |_|         |___|   |___| 
  
  Cypress Tests Orchestrator
  Version: ${opts.config.version}
      
      ---------------

  `);
};

export default hook;
