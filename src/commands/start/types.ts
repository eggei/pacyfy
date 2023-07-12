import { ChildProcessWithoutNullStreams } from "child_process";

type ServiceContext = Record<
  string,
  Partial<{
    error: string;
    process: ChildProcessWithoutNullStreams | null;
  }>
>;
export type TaskContext = {
  error?: string | null; // currently unused - we need to make the Context a class so it sets error everytime an error is set in services or databases
  services: ServiceContext;
  databases: ServiceContext;
};
