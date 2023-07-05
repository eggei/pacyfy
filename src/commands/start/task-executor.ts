import { spawn } from "child_process";
import { Observable } from "rxjs";
import { Service } from "../../getConfig";
import { TaskContext } from "./types";
import Listr = require("listr");
import waitOn = require("wait-on");
import { WaitOnOptions } from "wait-on";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// config
const maxRetries = 10;
const healthRetryInterval = 1000;

export function getServiceStartTask(service: Service) {
  return {
    title: `Run`,
    task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
      return new Observable((observer) => {
        observer.next(`Running: ${service.run}`);
        // initailize the service context
        ctx[service.name] = { error: false, process: null };
        const runCMD = service.run.split(" ");

        const serviceProcess = spawn(runCMD[0], [...runCMD.slice(1)], {
          detached: true,
        });
        // place process in context for later use
        ctx[service.name].process = serviceProcess;

        // If error in the process
        let error = "";
        serviceProcess.stderr.on("data", (chunk) => {
          error += chunk.toString();
        });

        // If log in the process
        let log = "";
        serviceProcess.stdout.on("data", (chunk) => {
          log += chunk.toString();
          observer.next(log);
          observer.complete();
        });

        // If process is closed
        serviceProcess.on("close", (code) => {
          if (code !== 0) {
            observer.error(
              new Error(`Failed to run the service - ${error || log}`)
            );
            ctx[service.name] = { error: true };
          }
        });
      }) as unknown as Listr.ListrTaskResult<TaskContext>;
    },
  };
}

export function getServiceHealthTask(service: Service) {
  if (!service.healthCheckURL) {
    return [];
  }

  return [
    {
      title: `Health check`,
      task: (ctx: TaskContext, task: Listr.ListrTaskWrapper<TaskContext>) => {
        return new Observable((observer) => {
          let timeElapsed = 0;
          const defaultTimeout = 10000;
          // start a timer to show time elapsed
          const timer = setInterval(() => {
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
              observer.error(err.message);
            })
            .finally(() => {
              clearInterval(timer);
            });
        }) as unknown as Listr.ListrTaskResult<TaskContext>;
      },
    },
  ];
}

// let retryCount = 0;
/** DEPRACATED - old manual health checker  */
// const healthCheck = (observer: any, ctx: any, service: Service) => {
//   retryCount++;
//   const serviceProcess = spawn("curl", ["-sSf", service.healthCheckURL]);

//   // keeps the log
//   let log = "";
//   serviceProcess.stdout.on("data", (chunk) => {
//     log += chunk.toString();
//     observer.next(log);
//   });

//   // If error in the process, retry if possible
//   let error = "";
//   serviceProcess.stderr.on("data", async (chunk) => {
//     error += chunk.toString();
//   });

//   // If process is closed
//   serviceProcess.on("close", (code) => {
//     // if the code is 0, we're good
//     if (code === 0) {
//       observer.complete();
//       return;
//     }
//     // if the retry count is maxed out, give some output
//     if (retryCount === maxRetries) {
//       console.log(log + `Exit code: ${code}`);
//       if (error) {
//         ctx[service.name] = { error: true };
//         observer.error(new Error(error));
//         return;
//       }
//     }
//   });

//   // wait and retry
//   observer.next(
//     `Checking: ${service.healthCheckURL} (${retryCount}/${maxRetries} failed attempt) `
//   );
//   sleep(healthRetryInterval).then(() => healthCheck(observer, ctx, service));
// };
