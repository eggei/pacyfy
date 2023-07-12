import { spawn } from "child_process";
import { Observable } from "rxjs";
import { Service, defaultConfig } from "../../config";
import { TaskContext } from "./types";
import Listr = require("listr");
import waitOn = require("wait-on");
import { WaitOnOptions } from "wait-on";
import treeKill = require("tree-kill");
import { Database } from "../../config";

export function getDatabaseStartTask(db: Database) {
  if (!db) return [];
  return [
    {
      title: `Run`,
      task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
        return new Observable((observer) => {
          observer.next(`Running: ${db.name}`);
          // initailize the database context
          ctx[db.name] = { error: "", process: null };

          const [cmd, ...args] = db.run.split(" ");
          const dbStartProcess = spawn(cmd, args);
          observer.next(`Running command: ${db.run}`);
          // place process in context for later use
          ctx[db.name].process = dbStartProcess;
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
              ctx[db.name].error = errorLog;
              observer.error(error);
            } else {
              observer.complete();
            }
          });
        }) as unknown as Listr.ListrTaskResult<TaskContext>;
      },
    },
  ];
}
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
            const errorInRunTask = ctx[db.name].error;
            if (errorInRunTask) {
              observer.error(new Error(errorInRunTask));
              return;
            }

            const dbHealthProcess = spawn(runCMD[0], [...runCMD.slice(1)]);

            dbHealthProcess.on("exit", (code) => {
              if (code === 0) {
                observer.complete();
              } else {
                retries++;
                if (retries >= maxRetries) {
                  const err = new Error(
                    `Health check failed after ${maxRetries} retries`
                  );
                  observer.error(err); // report error to the observer
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
