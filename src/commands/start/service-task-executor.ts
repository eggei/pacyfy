import { spawn } from "child_process";
import { Observable } from "rxjs";
import { Service, defaultConfig } from "../../config";
import { TaskContext } from "./types";
import Listr = require("listr");
import waitOn = require("wait-on");
import { WaitOnOptions } from "wait-on";
import treeKill = require("tree-kill");

export function getServiceStartTask(service: Service) {
  if (!service) return [];
  return [
    {
      title: `Run`,
      task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
        return new Observable((observer) => {
          observer.next(`Running: ${service.run}`);
          // initailize the service context
          ctx[service.name] = { error: "", process: null };

          const [cmd, ...args] = service.run.split(" ");
          const serviceProcess = spawn(cmd, args);

          // place process in context for later use
          ctx[service.name].process = serviceProcess;

          // If error in the process, save it in state
          let error = "";
          serviceProcess.stderr.on("data", (chunk) => {
            error += chunk.toString();
          });

          // If log in the process
          let log = "";
          serviceProcess.stdout.on("data", (chunk) => {
            log += chunk.toString();
            observer.next(log);

            // any errors in this process will be caught in the health check
            // so, we just run given command and complete the observer once we
            // get any log from the process
            observer.complete();
          });

          serviceProcess.on("exit", (code) => {
            if (code !== 0) {
              const errorLog = `Following error occured in the process: ${
                error ||
                "Process does not produce error output. Error might be related to something else than the process itself."
              }`;
              ctx[service.name].error = errorLog;
              observer.error(new Error(error));
            } else {
              observer.complete();
            }
          });

          // If the process is forcefully killed
          process.on("SIGTERM", () => {
            if (serviceProcess.pid) {
              treeKill(serviceProcess.pid, (err?: Error) => {
                if (err) {
                  task.report(err);
                  observer.error(err);
                } else {
                  task.report(new Error("Process was killed"));
                  observer.complete();
                }
              });
            }
          });
        }) as unknown as Listr.ListrTaskResult<TaskContext>;
      },
    },
  ];
}

export function getServiceHealthTask(service: Service) {
  if (!service) return [];
  return [
    {
      title: `Health check`,
      task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
        return new Observable((observer) => {
          if (!service.healthCheckURL) {
            task.skip("No health check URL provided");
            observer.complete();
          }

          /**
           * timeElapsed is to keep track of the time elapsed
           * since the health check started. Once it reaches the timeout
           * the health check will be considered failed
           * */
          let timeElapsed = 0;
          const defaultTimeout =
            service.healthCheckTimeout || defaultConfig.healthCheckTimeout;

          // start a timer to show time elapsed
          const timer = setInterval(() => {
            // if there was an error in the run task, it should be caught here
            const errorInRunTask = ctx[service.name].error;
            if (errorInRunTask) {
              observer.error(new Error(errorInRunTask));
              return;
            }
            timeElapsed++;
            observer.next(
              `Waiting for ${service.healthCheckURL} (${timeElapsed} seconds elapsed) `
            );
          }, 1000);

          const waitConfig: WaitOnOptions = {
            resources: [service.healthCheckURL],
            timeout: service.healthCheckTimeout || defaultTimeout,
            tcpTimeout: 1000,
          };

          waitOn(waitConfig)
            .then(() => {
              observer.complete();
            })
            .catch((err: Error) => {
              observer.error(err);
            })
            .finally(() => {
              clearInterval(timer);
            });
        }) as unknown as Listr.ListrTaskResult<TaskContext>;
      },
    },
  ];
}
