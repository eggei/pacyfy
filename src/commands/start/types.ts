import { ChildProcessWithoutNullStreams } from "child_process";

type ServiceContext = Record<
  string,
  Partial<{
    error: string;
    process: ChildProcessWithoutNullStreams | null;
  }>
>;
export type TaskContext = {
  services: ServiceContext;
  databases: ServiceContext;
};
