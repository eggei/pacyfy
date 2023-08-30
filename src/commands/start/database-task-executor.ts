import { spawn } from "child_process";
import { Observable } from "rxjs";
import { Service, defaultConfig } from "../../config";
import { TaskContext } from "./types";
import Listr = require("listr");
import waitOn = require("wait-on");
import { WaitOnOptions } from "wait-on";
import treeKill = require("tree-kill");
import { Database } from "../../config";
import { APP_NAME } from "../../constants";
import { getPacyfyError } from "./helpers";

export function getDatabaseStartTask(db: Database) {
  if (!db) return [];
  return [
    {
      title: `Run`,
      task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
        return new Observable((observer) => {
          observer.next(`Running: ${db.name}`);

          const [cmd, ...args] = db.run.split(" ");
          const dbStartProcess = spawn(cmd, args);
          observer.next(`Running command: ${db.run}`);
          // place process in context for later use
          ctx.databases[db.name].process = dbStartProcess;
          // If error in the process, save it in state
          let error = "";
          dbStartProcess.stderr.on("data", (chunk) => {
            error += chunk.toString();
          });
          // If log in the process
          let log = "";
          dbStartProcess.stdout.on("data", (chunk) => {
            log += chunk.toString();
            observer.next(log);
            // any errors in this process will be caught in the health check
            // so, we just run given command and complete the observer once we
            // get any log from the process
            observer.complete();
          });

          dbStartProcess.on("exit", (code) => {
            if (code !== 0) {
              const errorLog = `Following error occured in the process: ${
                error ||
                "Process does not produce error output. Error might be related to something else than the process itself."
              }`;
              ctx.databases[db.name].error = errorLog;
              observer.error(getPacyfyError(error));
            } else {
              observer.complete();
            }
          });
        }) as unknown as Listr.ListrTaskResult<TaskContext>;
      },
    },
  ];
}

// function gracefulShutdown(ctx: TaskContext, db: Database) {
//   console.log(`Gracefully shutting down ${db.name}...`);
//   const dbProcess = ctx.databases[db.name].process;
//   // kill the process (if still exists)
//   if (dbProcess && dbProcess.pid) {
//     treeKill(dbProcess.pid, "SIGTERM", (err) => {
//       if (err) {
//         console.error(getPacyfyError(err));
//       }
//     });
//   }
//   // run the teardown command provided by the user
//   tearDownDB(console.error, db);
// }

// config
const maxRetries = 10;
const healthRetryInterval = 1000;
export function getDatabaseHealthTask(db: Database) {
  if (!db) return [];
  return [
    {
      title: `Health check`,
      task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
        return new Observable((observer) => {
          const runCMD = db.healthCheckCMD.split(" ");
          let retries = 0;

          const runHealthCheck = () => {
            //   if there was an error in the run task, it should be caught here
            const errorInRunTask = ctx.databases[db.name].error;
            if (errorInRunTask) {
              observer.error(getPacyfyError(errorInRunTask));
              return;
            }

            const dbHealthProcess = spawn(runCMD[0], [...runCMD.slice(1)]);

            dbHealthProcess.on("exit", (code) => {
              if (code === 0) {
                observer.complete();
              } else {
                retries++;
                if (retries >= maxRetries) {
                  const err = `Health check failed after ${maxRetries} retries`;
                  observer.error(getPacyfyError(err)); // report error to the observer
                } else {
                  observer.next(
                    `Retries: ${retries}/${maxRetries} - Running: ${db.healthCheckCMD}`
                  );
                  setTimeout(runHealthCheck, healthRetryInterval);
                }
              }
            });
          };

          runHealthCheck();
        }) as unknown as Listr.ListrTaskResult<TaskContext>;
      },
    },
  ];
}
