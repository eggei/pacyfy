import { spawn } from "child_process";
import { Observable } from "rxjs";
import { Service, defaultConfig } from "../../config";
import { TaskContext } from "./types";
import { DefaultRenderer, ListrTask } from "listr2";
import waitOn = require("wait-on");
import { WaitOnOptions } from "wait-on";
import treeKill = require("tree-kill");
import { getPacyfyError } from "./helpers";

export function getServiceStartTask(service: Service) {
  if (!service) return null;
  const task: ListrTask<TaskContext, typeof DefaultRenderer> = {
    title: `Run`,
    task: (ctx, task) => {
      return new Observable((observer) => {
        observer.next(`Running: ${service.run}`);

        const [cmd, ...args] = service.run.split(" ");
        const serviceProcess = spawn(cmd, args);

        // place process in context for later use
        ctx.services[service.name].process = serviceProcess;

        // If error in the process, save it in state
        let error = "";
        serviceProcess.stderr.on("data", (chunk) => {
          error += chunk.toString();
        });

        serviceProcess.stdout.on("data", (chunk) => {
          // TODO: logs are spitted out when the entire list of tasks are completed in default renderer
          // so, we need to find a way to show logs in realtime whilst using the default renderer
          // For now, don't show logs
          // process.stdout.write(`[SERVICE LOG: ${service.name}] ${chunk}`);

          // any errors in this process will be caught in the health check
          // so, we just run given command and complete the observer once we
          // get any log from the process
          observer.complete();
        });

        serviceProcess.on("exit", (code) => {
          if (code !== 0) {
            ctx.services[service.name].error = error;
            observer.error(getPacyfyError(error));
          } else {
            observer.complete();
          }
        });

        // If the process is forcefully killed
        process.on("SIGTERM", () => {
          if (serviceProcess.pid) {
            treeKill(serviceProcess.pid, (err?: Error) => {
              if (err) {
                observer.error(getPacyfyError(err));
              } else {
                observer.complete();
              }
            });
          }
        });
      });
    },
  };
  return task;
}

export function getServiceHealthTask(service: Service) {
  if (!service) return null;
  const task: ListrTask<TaskContext, typeof DefaultRenderer> = {
    title: `Health check`,
    task: (ctx, task) => {
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
          const errorInRunTask = ctx.services[service.name].error;
          if (errorInRunTask) {
            observer.error(getPacyfyError(errorInRunTask));
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
            observer.error(getPacyfyError(err));
          })
          .finally(() => {
            clearInterval(timer);
          });
      });
    },
  };
  return task;
}
