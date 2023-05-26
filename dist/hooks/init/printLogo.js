"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hook = async function (opts) {
    process.stdout.write(`
                  ___     
  ___ ___ ___ _ _|  _|_ _ 
 | . | .'|  _| | |  _| | |
 |  _|__,|___|_  |_| |_  |
 |_|         |___|   |___| 
  
  Cypress Test Runner
  Version: ${opts.config.version}
      
      ---------------

  `);
};
exports.default = hook;
